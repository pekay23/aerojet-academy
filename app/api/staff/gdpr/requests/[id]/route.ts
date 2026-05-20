import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess, apiError } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

const schema = z.object({
  status: z.enum(['RECEIVED', 'IN_PROGRESS', 'AWAITING_USER', 'COMPLETED', 'DENIED', 'CANCELLED']).optional(),
  assignedToId: z.string().nullable().optional(),
  notes: z.string().max(2000).optional(),
  decisionReason: z.string().max(500).optional(),
  evidenceUrl: z.string().url().optional(),
})

export const PATCH = withErrorHandler(async (
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_GDPR)
  const { id } = await ctx.params
  const body = schema.parse(await req.json())

  const existing = await prismaUnfiltered.dataSubjectRequest.findUnique({ where: { id } })
  if (!existing) return apiError('Request not found', 404)

  const updated = await prismaUnfiltered.dataSubjectRequest.update({
    where: { id },
    data: {
      ...body,
      completedAt: body.status === 'COMPLETED' ? new Date() : existing.completedAt,
    },
  })

  await createAuditLog({
    userId: actor.id,
    action: 'UPDATE',
    entity: 'DataSubjectRequest',
    entityId: id,
    description: `DSR ${id} updated`,
    changes: { before: existing, after: updated },
  })

  return apiSuccess(updated)
})
