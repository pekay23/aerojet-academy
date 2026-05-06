import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const [totalEnrollments, byStatus, byCourse, byMonth] = await Promise.all([
    prismaUnfiltered.enrollment.count(),
    prismaUnfiltered.enrollment.groupBy({ by: ['status'], _count: true }),
    prismaUnfiltered.enrollment.groupBy({ by: ['courseId'], _count: true, orderBy: { _count: { courseId: 'desc' } }, take: 10 }),
    prismaUnfiltered.enrollment.groupBy({
      by: ['createdAt'],
      _count: true,
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return apiSuccess({ totalEnrollments, byStatus, byCourse, byMonth })
})

