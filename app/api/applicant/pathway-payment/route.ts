import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireApplicant()
  const body = await req.json()
  const { proofUrl, amount, paymentType, currency = 'EUR' } = body

  if (!proofUrl) return apiError('Proof URL is required')
  if (!amount) return apiError('Payment amount is required')
  if (!paymentType) return apiError('Payment type is required')

  // Create payment record
  // Always use EUR as the base currency for the 'amount' field
  // to ensure consistent reporting. Store original in paymentCurrency/originalAmount.
  const referenceCode = `TUI-${user.id}-${Date.now()}`
  const isEur = currency === 'EUR'

  await prisma.payment.create({
    data: {
      userId: user.id,
      amount: parseFloat(amount), // Assuming this is already the EUR amount or will be converted by staff manually
      currency: 'EUR',
      paymentCurrency: currency,
      originalAmount: parseFloat(amount),
      paymentMethod: 'BANK_TRANSFER',
      status: 'PENDING',
      proofUrl,
      referenceType: paymentType, // e.g. 'SEAT_CONFIRMATION', 'YEAR_1_FULL', 'FULL_PROGRAMME'
      referenceCode,
      notes: `Pathway tuition payment: ${paymentType.replace(/_/g, ' ')} ${!isEur ? `(${currency} ${amount})` : ''}`,
    },
  })

  return apiSuccess({ message: 'Payment proof uploaded and submitted for review.' })
})
