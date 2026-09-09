import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiCreated, apiError, apiSuccess } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import {
  listEmailRegistry,
  seedSystemEmailRegistry,
  invalidateEmailRegistryCache,
  cleanupDuplicateRegistryEntries,
  SYSTEM_EMAIL_INVENTORY,
} from '@/lib/email/registry'

const createSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().max(280).optional(),
  address: z.string().email().max(120),
})

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin()

  // Optional: clean up duplicate AUTO entries when ?cleanup=duplicates is passed
  const url = new URL(req.url)
  if (url.searchParams.get('cleanup') === 'duplicates') {
    const actor = await requireAdmin()
    const { removed, details } = await cleanupDuplicateRegistryEntries()
    if (removed > 0) {
      await createAuditLog({
        userId: actor.id,
        action: 'DELETE',
        entity: 'EmailRegistryEntry',
        entityId: 'bulk-duplicates',
        description: `Cleaned up ${removed} duplicate email registry entries`,
        changes: { after: { removed, details } },
      })
    }
    return apiSuccess({ removed, details })
  }

  await seedSystemEmailRegistry()
  const entries = await listEmailRegistry()

  // Annotate AUTO entries with their canonical (code-defined) address so the
  // UI can show whether the address has been customized by an admin.
  const annotated = entries.map((e) => {
    if (e.category === 'AUTO') {
      const canonical = SYSTEM_EMAIL_INVENTORY.find((c) => c.title === e.title)
      return { ...e, canonicalAddress: canonical?.address ?? null }
    }
    return { ...e, canonicalAddress: null }
  })

  return apiSuccess(annotated)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const actor = await requireAdmin()
  const body = createSchema.parse(await req.json())

  const existing = await prismaUnfiltered.emailRegistryEntry.findUnique({
    where: { address: body.address },
  })
  if (existing) return apiError('That address is already in the registry', 409)

  const created = await prismaUnfiltered.emailRegistryEntry.create({
    data: {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      address: body.address.trim().toLowerCase(),
      category: 'CUSTOM',
      isSystem: false,
      createdById: actor.id,
    },
  })

  await createAuditLog({
    userId: actor.id,
    action: 'CREATE',
    entity: 'EmailRegistryEntry',
    entityId: created.id,
    description: `Added "${created.title}" to email registry`,
    changes: { after: created },
  })
  invalidateEmailRegistryCache()
  return apiCreated(created)
})
