import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { topUpWallet } from '@/lib/wallet/operations'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { PaymentStatus } from '@prisma/client'

// POST /api/staff/wallet-topups/[id]/approve
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Top-up ID required')

    const body = await req.json()
    const { action, reason } = body

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!payment) return apiNotFound('Top-up request not found')
    if (payment.status !== 'PENDING') return apiError(`Already ${payment.status}`)

    if (action === 'approve') {
      await prisma.payment.update({
        where: { id },
        data: { status: PaymentStatus.APPROVED, approvedBy: staff.id, approvedAt: new Date() },
      })

      await prisma.$transaction(async (tx) => {
        await topUpWallet(
          tx,
          payment.userId,
          Number(payment.amount),
          `Wallet top-up approved (Payment: ${payment.referenceCode})`,
          payment.id,
          'PAYMENT_ID'
        )

        await tx.notification.create({
          data: {
            userId: payment.userId,
            title: 'Wallet Top-Up Approved',
            message: `Your wallet top-up of €${payment.amount} has been approved and credited to your account.`,
            type: 'SUCCESS',
            linkUrl: '/student/wallet',
            linkText: 'View Wallet',
          },
        })
      })

      await createAuditLog({
        action: AuditAction.WALLET_TOP_UP,
        entity: 'Payment',
        entityId: id,
        userId: staff.id, // The staff performed the action
        details: {
          targetUserId: payment.userId,
          amount: payment.amount,
          reference: payment.referenceCode,
        },
      })

      return apiSuccess({ message: `Top-up of €${payment.amount} approved and credited` })
    } else {
      await prisma.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.REJECTED,
          rejectedBy: staff.id,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      })

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: 'Wallet Top-Up Rejected',
          message: `Your wallet top-up request of €${payment.amount} has been rejected. Reason: ${reason || 'Not provided'}.`,
          type: 'ERROR',
          linkUrl: '/student/wallet',
          linkText: 'View Wallet',
        },
      })

      return apiSuccess({ message: 'Top-up rejected' })
    }
  }
)
