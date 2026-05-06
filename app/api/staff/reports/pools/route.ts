import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const [totalPools, byStatus, avgMembers, confirmedRevenue] = await Promise.all([
    prismaUnfiltered.examPool.count(),
    prismaUnfiltered.examPool.groupBy({ by: ['status'], _count: true }),
    prismaUnfiltered.examPool.aggregate({ _avg: { currentMemberCount: true } }),
    prismaUnfiltered.poolMembership.aggregate({ where: { status: 'CONFIRMED' }, _sum: { amountPaid: true }, _count: true }),
  ])

  return apiSuccess({
    totalPools,
    byStatus,
    averageMembers: avgMembers._avg.currentMemberCount,
    confirmedRevenue: confirmedRevenue._sum.amountPaid,
    confirmedMembers: confirmedRevenue._count,
  })
})

