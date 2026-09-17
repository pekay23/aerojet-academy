import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess, apiError, RouteContext } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { invalidateEmailRegistryCache } from '@/lib/email/registry'

const patchSchema = z.object({
  title: z.string().min(2).max(80).optional(),
  description: z.string().max(280).nullable().optional(),
  address: z.preprocess((val) => {
    if (val === null || val === undefined) return undefined
    if (typeof val === 'string' && val.trim() === '') return undefined
    if (typeof val === 'string') return val.trim()
    return val
  }, z.string().email().max(120).optional()),
})

export const PATCH = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const actor = await requireAdmin()
  const { id } = (await ctx!.params) as { id: string }
  const body = patchSchema.parse(await req.json())

  const existing = await prismaUnfiltered.emailRegistryEntry.findUnique({ where: { id } })
  if (!existing) return apiError('Entry not found', 404)

  // Check for address uniqueness if changing address
  if (body.address) {
    const duplicate = await prismaUnfiltered.emailRegistryEntry.findFirst({
      where: { address: body.address.toLowerCase(), id: { not: id } },
    })
    if (duplicate) return apiError('That address is already in the registry', 409)
  }

  const updated = await prismaUnfiltered.emailRegistryEntry.update({
    where: { id },
    data: {
      title: body.title?.trim() ?? existing.title,
      description: body.description?.trim() ?? existing.description,
      address: body.address ? body.address.toLowerCase() : existing.address,
    },
  })
  await createAuditLog({
    userId: actor.id,
    action: 'UPDATE',
    entity: 'EmailRegistryEntry',
    entityId: id,
    description: `Updated "${updated.title}" in email registry`,
    changes: { before: existing, after: updated },
  })
  invalidateEmailRegistryCache()
  return apiSuccess(updated)
})

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  const actor = await requireAdmin()
  const { id } = (await ctx!.params) as { id: string }

  const existing = await prismaUnfiltered.emailRegistryEntry.findUnique({ where: { id } })
  if (!existing) return apiError('Entry not found', 404)

  // AUTO (system) entries are protected from deletion UNLESS they are
  // duplicates — i.e. another entry shares the same title. The old seed
  // behaviour (before admin edits were preserved) could create duplicate
  // system entries; those are safe to remove individually.
  if (existing.category === 'AUTO') {
    const siblingCount = await prismaUnfiltered.emailRegistryEntry.count({
      where: { title: existing.title },
    })
    if (siblingCount <= 1)
      return apiError(
        'This is the only system entry for "' +
          existing.title +
          '". Use Edit to change its address, or use "Clean up duplicates" if you see duplicate entries.',
        400
      )
  }

  await prismaUnfiltered.emailRegistryEntry.delete({ where: { id } })
  await createAuditLog({
    userId: actor.id,
    action: 'DELETE',
    entity: 'EmailRegistryEntry',
    entityId: id,
    description: `Removed "${existing.title}" from email registry`,
    changes: { before: existing },
  })
  invalidateEmailRegistryCache()
  return apiSuccess({ deleted: true })
})
