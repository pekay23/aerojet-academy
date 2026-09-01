import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  const user = await requireApplicant()

  const [walletTransactions, payments] = await Promise.all([
    prismaUnfiltered.walletTransaction.findMany({
      where: { wallet: { userId: user.id } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prismaUnfiltered.payment.findMany({
      where: {
        userId: user.id,
        referenceType: 'WALLET_TOPUP',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const transactions = walletTransactions.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    type: t.type,
    status: t.type === 'TOP_UP' ? 'APPROVED' : 'COMPLETED',
    createdAt: t.createdAt.toISOString(),
    referenceType: t.referenceType || undefined,
    referenceId: t.referenceId || undefined,
    description: t.description || undefined,
  }))

  const formattedPayments = payments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    status: p.status,
    paymentMethod: p.paymentMethod || undefined,
    createdAt: p.createdAt.toISOString(),
    rejectionReason: p.rejectionReason || undefined,
  }))

  return NextResponse.json({ transactions, payments: formattedPayments })
})
