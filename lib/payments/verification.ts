import prisma from '@/lib/prisma/client'
import type { PaymentVerificationResult } from './types'

export async function verifyPaymentProof(paymentId: string): Promise<PaymentVerificationResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true },
  })

  if (!payment) return { verified: false, error: 'Payment not found' }
  if (!payment.proofUrl) return { verified: false, error: 'No payment proof uploaded' }

  return { verified: true }
}

export async function getPendingPayments(type?: string) {
  return prisma.payment.findMany({
    where: {
      status: 'PENDING',
      ...(type ? { referenceType: type } : {}),
    },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: 'asc' },
  })
}
