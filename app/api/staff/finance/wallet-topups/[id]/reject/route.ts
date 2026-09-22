import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions'
import { createAuditLog } from '@/lib/audit/logger'
import { rateLimitByUser, rateLimitByIP } from '@/lib/auth/helpers'
import { withErrorHandler, apiSuccess, apiError } from '@/lib/api/response'

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const staff = await requirePermission(PERMISSIONS.APPROVE_PAYMENTS)
  const { id } = await params
  const { reason } = await req.json()

  // Rate limiting: 30 requests/min per user, 20 requests/min per IP
  const userLimit = rateLimitByUser(staff.id, 30, 60000)
  if (!userLimit.allowed) {
    return apiError('Too many requests. Please try again later.', 429)
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const ipLimit = rateLimitByIP(ip, 20, 60000)
  if (!ipLimit.allowed) {
    return apiError('Too many requests from this IP. Please try again later.', 429)
  }

  if (!reason) {
    return apiError('Rejection reason is required', 400)
  }

  const payment = await prismaUnfiltered.payment.findUnique({
    where: { id },
  })

  if (!payment || payment.status !== 'PENDING' || payment.referenceType !== 'WALLET_TOPUP') {
    return apiError('Invalid or already processed top-up request')
  }

  await prismaUnfiltered.payment.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: staff.id,
      rejectionReason: reason,
    },
  })

  await createAuditLog({
    action: 'SYSTEM_UPDATE',
    entity: 'payments',
    entityId: id,
    userId: staff.id,
    description: `Rejected wallet top-up of ${payment.amount} for user ID ${payment.userId}. Reason: ${reason}`,
  })

  return apiSuccess({ success: true })
})
