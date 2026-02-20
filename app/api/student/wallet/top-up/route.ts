import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { walletTopUpSchema, validateBody } from '@/lib/validation/schemas'
import crypto from 'crypto'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const body = await req.json()
  const validation = validateBody(walletTopUpSchema, body)
  if (!validation.success) return apiError((validation as any).error)

  const { amount, proofUrl, notes } = validation.data
  const reference = `WTU-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      paymentMethod: 'WALLET_TOP_UP',
      amount,
      proofUrl,
      referenceCode: reference,
      referenceType: 'WALLET_TOP_UP',
      notes: notes || null,
    },
  })

  return apiCreated({
    message: `Top-up request of €${amount} submitted. Awaiting staff approval.`,
    paymentId: payment.id,
    reference,
  })
})

