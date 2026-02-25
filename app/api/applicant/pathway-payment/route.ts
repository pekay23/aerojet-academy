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
  // We use the user ID and paymentType to make a unique reference code for this attempt
  const referenceCode = `TUI-${user.id}-${Date.now()}`

  await prisma.payment.create({
    data: {
      userId: user.id,
      amount: parseFloat(amount),
      currency,
      paymentMethod: 'BANK_TRANSFER',
      status: 'PENDING',
      proofUrl,
      referenceType: paymentType, // e.g. 'SEAT_CONFIRMATION', 'YEAR_1_FULL', 'FULL_PROGRAMME'
      referenceCode,
      notes: `Pathway tuition payment: ${paymentType.replace(/_/g, ' ')}`,
    },
  })

  return apiSuccess({ message: 'Payment proof uploaded and submitted for review.' })
})
