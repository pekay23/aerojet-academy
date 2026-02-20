import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireApplicant()
  const body = await req.json()
  const { proofUrl } = body
  if (!proofUrl) return apiError('Proof URL is required')

  // Fetch global registration settings
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['registration_fee', 'registration_currency'] } },
  })

  const fee = settings.find((s) => s.key === 'registration_fee')?.value || '350'
  const currency = settings.find((s) => s.key === 'registration_currency')?.value || 'EUR'

  // Update user and create payment record in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { paymentProofUrl: proofUrl },
    }),
    prisma.payment.upsert({
      where: {
        referenceCode: `REG-${user.id}`,
      },
      update: {
        proofUrl,
        amount: parseFloat(fee),
        currency,
        status: 'PENDING',
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        amount: parseFloat(fee),
        currency,
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        proofUrl,
        referenceType: 'REGISTRATION',
        referenceCode: `REG-${user.id}`,
      },
    }),
  ])

  return apiSuccess({ message: 'Payment proof uploaded and submitted for review.' })
})
