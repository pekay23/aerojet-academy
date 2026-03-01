import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { sendPaymentApprovedEmail, sendPaymentRejectedEmail } from '@/lib/email/service'
import { PaymentStatus } from '@prisma/client'
import { topUpWallet } from '@/lib/wallet/operations'
import { shouldPromoteOnPayment, promoteApplicantToStudent } from '@/lib/enrollment/pathway'

// POST /api/staff/payments/[id]/approve — Approve or reject a payment
export const POST = withErrorHandler(
  async (req: NextRequest, context: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id

    if (!id) return apiError('Payment ID required')

    let body: any
    try {
      body = await req.json()
    } catch (e) {
      return apiError('Invalid request body', 400)
    }

    const { action, notes, reason } = body
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
        await prisma.$transaction(async (tx) => {
          // If Wallet doesn't exist yet (APPLICANT topping up for the first time), create it
          let wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } })
          if (!wallet) {
            wallet = await tx.wallet.create({
              data: {
                userId: payment.userId,
                balance: 0,
                reservedBalance: 0,
                availableBalance: 0,
              },
            })
          }

          await topUpWallet(
            tx,
            payment.userId,
            Number(payment.amount),
            `Wallet top-up approved (Ref: ${topUpReference})`,
            payment.id,
            'PAYMENT_ID'
          )
        })
      }

      // Handle Course Enrollment (Modular)
      if (payment.referenceType === 'COURSE' && payment.referenceId) {
        await prisma.enrollment.update({
          where: {
            userId_courseId: {
              userId: payment.userId,
              courseId: payment.referenceId,
            },
          },
          data: {
            status: 'ENROLLED',
            approvedAt: new Date(),
            amountPaid: payment.amount,
          },
        })
      }

      // Promote APPLICANT → STUDENT if payment type satisfies pathway conditions
      if (
        payment.user.role === 'APPLICANT' &&
        payment.user.status === 'ACTIVE' &&
        payment.referenceType &&
        shouldPromoteOnPayment(payment.user.programmeChoice, payment.referenceType)
      ) {
        await promoteApplicantToStudent(payment.userId, staff.id)
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
