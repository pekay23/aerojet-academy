import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions'
import { createAuditLog } from '@/lib/audit/logger'
import { getOrCreateWallet, topUpWallet } from '@/lib/wallet/operations'
import { convertCurrency } from '@/lib/currency-api'
import { rateLimitByUser, rateLimitByIP } from '@/lib/auth/helpers'
import { withErrorHandler, apiSuccess, apiError, apiNotFound } from '@/lib/api/response'

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const staff = await requirePermission(PERMISSIONS.APPROVE_PAYMENTS)
    const { id } = await params

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

    const payment = await prismaUnfiltered.payment.findUnique({
      where: { id },
    })

    if (!payment) return apiNotFound('Payment record not found')
    if (payment.status !== 'PENDING') return apiError('Top-up request is not pending')
    if (payment.referenceType !== 'WALLET_TOPUP')
      return apiError('Payment is not a wallet top-up request')

    // Ensure wallet exists before tx
    await getOrCreateWallet(payment.userId)

    // Use paymentCurrency and originalAmount if available (standardized fields)
    const paymentCurrency =
      payment.paymentCurrency || (payment.currency !== 'EUR' ? payment.currency : 'EUR')
    const originalAmount = payment.originalAmount
      ? Number(payment.originalAmount)
      : Number(payment.amount)

    let eurAmount = Number(payment.amount) // Default to stored indicative amount
    let conversionNote = ''

    if (paymentCurrency !== 'EUR') {
      try {
        const { convertedAmount, rate } = await convertCurrency(
          originalAmount,
          paymentCurrency,
          'EUR'
        )
        eurAmount = convertedAmount
        conversionNote = ` (converted from ${paymentCurrency} ${originalAmount} at rate ${rate.toFixed(4)})`
      } catch (err) {
        console.error('Conversion failed during approval:', err)
        // Fallback to indicative amount if live conversion fails
        conversionNote = ` (using indicative amount; live conversion failed)`
      }
    }

    // Process atomically
    await prismaUnfiltered.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: staff.id,
        },
      })

      // Top up wallet in EUR
      await topUpWallet(
        tx,
        payment.userId,
        eurAmount,
        `Wallet top-up approved by admin${conversionNote}`,
        payment.id,
        'PAYMENT_ID'
      )

      await tx.notification.create({
        data: {
          userId: payment.userId,
          title: 'Wallet Top-Up Approved',
          message:
            paymentCurrency !== 'EUR'
              ? `Your ${paymentCurrency} ${payment.amount} top-up has been approved and credited as EUR ${eurAmount.toFixed(2)}.`
              : `Your wallet top-up of EUR ${payment.amount} has been approved.`,
          type: 'SUCCESS',
          linkUrl: '/student/wallet',
          linkText: 'View Wallet',
        },
      })
    })

    // Qualify any pending referral for this user (non-blocking)
    import('@/lib/referral/operations')
      .then(({ qualifyReferral }) => qualifyReferral(payment.userId))
      .catch(console.error)

    await createAuditLog({
      action: 'SYSTEM_UPDATE',
      entity: 'payments',
      entityId: id,
      userId: staff.id,
      description: `Approved wallet top-up of ${payment.amount} for user ID ${payment.userId}`,
    })

    return apiSuccess({ success: true })
  }
)
