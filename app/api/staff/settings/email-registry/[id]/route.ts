import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess, apiError } from '@/lib/api/response'
import { requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

const patchSchema = z.object({
  title: z.string().min(2).max(80).optional(),
  description: z.string().max(280).nullable().optional(),
})

export const PATCH = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin()
    const { id } = await ctx.params
    const body = patchSchema.parse(await req.json())

    const existing = await prismaUnfiltered.emailRegistryEntry.findUnique({ where: { id } })
    if (!existing) return apiError('Entry not found', 404)
    if (existing.isSystem) return apiError('System entries cannot be edited', 400)

    const updated = await prismaUnfiltered.emailRegistryEntry.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? existing.title,
        description: body.description?.trim() ?? existing.description,
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
    return apiSuccess(updated)
  }
)

export const DELETE = withErrorHandler(
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin()
    const { id } = await ctx.params

    const existing = await prismaUnfiltered.emailRegistryEntry.findUnique({ where: { id } })
    if (!existing) return apiError('Entry not found', 404)
    if (existing.isSystem) return apiError('System entries cannot be deleted', 400)

    await prismaUnfiltered.emailRegistryEntry.delete({ where: { id } })
    await createAuditLog({
      userId: actor.id,
      action: 'DELETE',
      entity: 'EmailRegistryEntry',
      entityId: id,
      description: `Removed "${existing.title}" from email registry`,
      changes: { before: existing },
    })
    return apiSuccess({ deleted: true })
  }
)
