import prisma from '@/lib/database/prisma'
import type { PaymentVerificationResult } from './types'

export async function verifyPaymentProof(paymentId: string): Promise<PaymentVerificationResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true },
  })

  if (!payment) return { verified: false, error: 'Payment not found' }
  if (!payment.proofUrl) return { verified: false, error: 'No payment proof uploaded' }

  // Manual verification — staff must review and approve
  return { verified: true }
}

export async function getPendingPayments(type?: string) {
  const where: any = { status: 'PENDING' }
  if (type) where.referenceType = type

  return prisma.payment.findMany({
    where,
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: 'asc' },
  })
}
