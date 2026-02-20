import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const [totalPayments, approvedTotal, byType, pendingTotal] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
    prisma.payment.groupBy({
      by: ['referenceType'],
      where: { status: 'APPROVED' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  const walletStats = await prisma.wallet.aggregate({
    _sum: { balance: true, reservedBalance: true },
  })

  return apiSuccess({
    totalPayments,
    approvedRevenue: approvedTotal._sum.amount,
    pendingRevenue: pendingTotal._sum.amount,
    pendingCount: pendingTotal._count,
    byType,
    walletStats: {
      totalBalance: walletStats._sum.balance,
      totalReserved: walletStats._sum.reservedBalance,
    },
  })
})

