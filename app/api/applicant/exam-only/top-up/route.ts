import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { trackPaymentSubmitted } from '@/lib/analytics/events'
import { apiError, withErrorHandler } from '@/lib/api/response'

export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireApplicant()

  const { amount, paymentMethodId, proofUrl } = await request.json()

  if (!amount || amount < 0) {
    return apiError('Invalid amount', 400)
  }

  // Get payment method name from ID if provided
  let paymentMethodName = 'BANK_TRANSFER'
  if (paymentMethodId) {
    const paymentMethod = await prismaUnfiltered.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    })
    if (paymentMethod) {
      paymentMethodName = paymentMethod.label
    }
  }

  const account = await prismaUnfiltered.user.findUnique({
    where: { id: user.id },
    select: {
      registrationCode: true,
      programmeChoice: true,
    },
  })

  if (!account?.registrationCode) {
    return apiError('No registration code found', 400)
  }

  const payment = await prismaUnfiltered.$transaction(async (tx) => {
    const existingPayment = await tx.payment.findFirst({
      where: {
        userId: user.id,
        referenceType: 'WALLET_TOPUP',
        status: 'PENDING',
      },
    })

    if (existingPayment) {
      throw new Error('DUPLICATE_PENDING')
    }

    const created = await tx.payment.create({
      data: {
        userId: user.id,
        amount: Number(amount),
        currency: 'EUR',
        status: 'PENDING',
        referenceType: 'WALLET_TOPUP',
        paymentMethod: paymentMethodName,
        proofUrl: proofUrl || null,
        proofUploadedAt: proofUrl ? new Date() : null,
      },
    })

    // Analytics tracking (non-blocking)
    trackPaymentSubmitted(Number(created.amount), created.currency, created.id, created.userId, created.paymentMethod).catch(() => {})

    return created
  }, { isolationLevel: 'Serializable' }).catch((err) => {
    if (err.message === 'DUPLICATE_PENDING') return null
    throw err
  })

  if (!payment) {
    return apiError(
      'You already have a pending top-up. Please wait for it to be processed.',
      400
    )
  }

  return NextResponse.json({
    success: true,
    paymentId: payment.id,
    registrationCode: account.registrationCode,
  })
})
