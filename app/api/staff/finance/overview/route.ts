import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    totalApproved,
    monthRevenue,
    lastMonthRevenue,
    pendingCount,
    pendingTotal,
    recentTransactions,
  ] = await Promise.all([
    // All-time approved total
    prisma.payment.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true },
    }),
    // This month
    prisma.payment.aggregate({
      where: { status: 'APPROVED', approvedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    // Last month
    prisma.payment.aggregate({
      where: { status: 'APPROVED', approvedAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    }),
    // Recent transactions
    prisma.payment.findMany({
      where: { status: { in: ['APPROVED', 'REJECTED', 'PENDING'] } },
      include: {
        user: {
          include: { profile: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return NextResponse.json({
    totalApproved: Number(totalApproved._sum.amount ?? 0),
    monthRevenue:  Number(monthRevenue._sum.amount ?? 0),
    lastMonthRevenue: Number(lastMonthRevenue._sum.amount ?? 0),
    pendingCount,
    pendingTotal: Number(pendingTotal._sum.amount ?? 0),
    recentTransactions,
  })
}
