import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess, apiError , RouteContext } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

const schema = z.object({
  status: z.enum(['APPROVED', 'PAID', 'REJECTED']),
  notes: z.string().max(280).optional(),
})

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['PAID', 'REJECTED'],
  PAID: [],
  REJECTED: [],
}

export const PATCH = withErrorHandler(async (
  req: NextRequest, ctx?: RouteContext) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_REFERRALS)
  const { id } = (await ctx!.params) as { id: string }
  const body = schema.parse(await req.json())

  const existing = await prismaUnfiltered.referralPayout.findUnique({ where: { id } })
  if (!existing) return apiError('Payout not found', 404)

  if (!ALLOWED_TRANSITIONS[existing.status].includes(body.status)) {
    return apiError(`Cannot move ${existing.status} → ${body.status}`, 400)
  }

  const updated = await prismaUnfiltered.referralPayout.update({
    where: { id },
    data: {
      status: body.status,
      approvedById: body.status === 'APPROVED' ? actor.id : existing.approvedById,
      paidAt: body.status === 'PAID' ? new Date() : existing.paidAt,
      notes: body.notes ?? existing.notes,
    },
  })

  await createAuditLog({
    userId: actor.id,
    action: 'UPDATE',
    entity: 'ReferralPayout',
    entityId: id,
    description: `Payout ${existing.status} → ${body.status}`,
    changes: { before: existing, after: updated },
  })

  return apiSuccess(updated)
})
