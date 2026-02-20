import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const POST = withErrorHandler(async (req: NextRequest) => {
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

  if (user.registrationPaid) {
    return apiError('Registration fee has already been paid')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      paymentProofUrl: proofUrl,
      status: 'PENDING',
    },
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
