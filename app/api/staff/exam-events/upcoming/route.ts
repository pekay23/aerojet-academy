import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const events = await prisma.examEvent.findMany({
    where: { status: { in: ['OPEN', 'CONFIRMED'] }, endDate: { gte: new Date() } },
    include: {
      pools: { include: { _count: { select: { memberships: true } } } },
      _count: { select: { pools: true } },
    },
    orderBy: { startDate: 'asc' },
    take: 10,
  })
  return apiSuccess(events)
})

