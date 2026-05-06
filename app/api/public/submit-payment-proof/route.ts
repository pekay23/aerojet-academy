import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { apiSuccess, apiError, apiNotFound, apiTooManyRequests, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { checkRateLimit, getClientIp } from '@/lib/auth/helpers'

export const POST = withErrorHandler(async (req: NextRequest) => {
  // Rate limit: 5 proof uploads per IP per hour
  const ip = getClientIp(req)
  if (!checkRateLimit(`submit-proof:${ip}`, 5, 60 * 60 * 1000)) {
    return apiTooManyRequests('Too many upload attempts. Please try again later.')
  }

  const body = await req.json()
  const { registrationCode, proofUrl } = body

  if (!registrationCode || !proofUrl) {
    return apiError('Registration code and proof URL are required')
  }

  const user = await prisma.user.findUnique({
    where: { registrationCode },
    include: { profile: true },
  })

  if (!user) {
    return apiNotFound('No account found with this registration code')
  }

  if (!user.emailVerified) {
    return apiError(
      'Please verify your email before uploading payment proof. Check your inbox for the verification link.',
      403
    )
  }

  if (user.registrationPaid) {
    return apiError('Registration fee has already been paid')
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update User to PENDING status and store proof URL
    await tx.user.update({
      where: { id: user.id },
      data: {
        paymentProofUrl: proofUrl,
        status: 'PENDING',
      },
    })

    // 2. Create a Payment record so it shows up in the admin queue
    await tx.payment.create({
      data: {
        userId: user.id,
        amount: user.registrationFee,
        currency: user.registrationCurrency,
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        proofUrl: proofUrl,
        proofUploadedAt: new Date(),
        referenceCode: registrationCode,
        referenceType: 'REGISTRATION',
      },
    })
  })

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: 'User',
    entityId: user.id,
    userId: user.id,
    details: { action: 'payment_proof_uploaded', registrationCode },
  })

  return apiSuccess({
    message: 'Payment proof submitted. You will be notified once it is reviewed.',
  })
})
