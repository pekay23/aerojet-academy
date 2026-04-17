import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!wallet) {
      return NextResponse.json({
        balance: 0,
        reservedBalance: 0,
        availableBalance: 0,
        transactions: [],
      })
    }

    return NextResponse.json({
      balance: Number(wallet.balance),
      reservedBalance: Number(wallet.reservedBalance),
      availableBalance: Number(wallet.availableBalance),
      transactions: wallet.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        referenceType: t.referenceType,
        balanceBefore: t.balanceBefore != null ? Number(t.balanceBefore) : undefined,
        balanceAfter: t.balanceAfter != null ? Number(t.balanceAfter) : undefined,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching wallet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
