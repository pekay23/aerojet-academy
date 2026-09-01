import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  const user = await requireApplicant()

  const wallet = await prismaUnfiltered.wallet.findUnique({
    where: { userId: user.id },
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
})
