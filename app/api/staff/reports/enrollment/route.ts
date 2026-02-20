import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const [totalEnrollments, byStatus, byCourse, byMonth] = await Promise.all([
    prisma.enrollment.count(),
    prisma.enrollment.groupBy({ by: ['status'], _count: true }),
    prisma.enrollment.groupBy({ by: ['courseId'], _count: true, orderBy: { _count: { courseId: 'desc' } }, take: 10 }),
    prisma.enrollment.groupBy({
      by: ['createdAt'],
      _count: true,
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return apiSuccess({ totalEnrollments, byStatus, byCourse, byMonth })
})

