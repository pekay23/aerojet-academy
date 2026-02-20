import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { sendPaymentApprovedEmail, sendPaymentRejectedEmail } from '@/lib/email/service'
import { PaymentStatus } from '@prisma/client'
import { topUpWallet } from '@/lib/wallet/operations'

// POST /api/staff/payments/[id]/approve — Approve or reject a payment
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Payment ID required')

    let body
    try {
      body = await req.json()
    } catch (e) {
      return apiError('Invalid request body', 400)
    }
    const { action, notes, reason } = body // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return apiError('Action must be "approve" or "reject"')
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: { include: { profile: true } } },
    })

    if (!payment) return apiNotFound('Payment not found')
    if (payment.status !== 'PENDING') return apiError(`Payment is already ${payment.status}`)

    if (action === 'approve') {
      await prisma.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.APPROVED,
          approvedBy: staff.id,
          approvedAt: new Date(),
          notes,
        },
      })

      // Handle Wallet Top-up
      if (payment.referenceType === 'WALLET_TOPUP') {
        const topUpReference = payment.referenceCode || `PAY-${payment.id.slice(-6)}`
        await topUpWallet(
          payment.userId,
          Number(payment.amount),
          `Wallet top-up approved (Ref: ${topUpReference})`,
          topUpReference
        )
      }

      if (payment.user.profile) {
        sendPaymentApprovedEmail(
          payment.user.email,
          payment.user.profile.firstName,
          payment.referenceType || 'Payment',
          Number(payment.amount)
        ).catch(console.error)
      }

      await createAuditLog({
        action: AuditAction.PAYMENT_APPROVE,
        entity: 'Payment',
        entityId: id,
        userId: staff.id,
        details: {
          targetUserId: payment.userId,
          amount: payment.amount,
          type: payment.referenceType,
        },
      })

      return apiSuccess({ message: 'Payment approved' })
    } else {
      if (!reason) return apiError('Rejection reason is required')

      await prisma.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.REJECTED,
          rejectedBy: staff.id,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      })

      if (payment.user.profile) {
        sendPaymentRejectedEmail(
          payment.user.email,
          payment.user.profile.firstName,
          payment.referenceType || 'Payment',
          reason
        ).catch(console.error)
      }

      await createAuditLog({
        action: AuditAction.PAYMENT_REJECT,
        entity: 'Payment',
        entityId: id,
        userId: staff.id,
        details: { targetUserId: payment.userId, reason },
      })

      return apiSuccess({ message: 'Payment rejected' })
    }
  }
)
