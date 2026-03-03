import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const [walletTransactions, payments] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { wallet: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.payment.findMany({
        where: {
          userId,
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
  } catch (error) {
    console.error('Error fetching wallet transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
