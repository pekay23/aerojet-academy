import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiCreated, apiError, apiSuccess } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { listEmailRegistry, seedSystemEmailRegistry } from '@/lib/email/registry'

const createSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().max(280).optional(),
  address: z.string().email().max(120),
})

export const GET = withErrorHandler(async () => {
  await requireAdmin()
  await seedSystemEmailRegistry()
  const entries = await listEmailRegistry()
  return apiSuccess(entries)
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
  return apiCreated(created)
})
