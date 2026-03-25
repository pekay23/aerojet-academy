import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler, parsePagination } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const searchParams = req.nextUrl.searchParams
  const { page, limit, skip } = parsePagination(searchParams)

  const where = { userId: user.id }

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      include: { class: { include: { course: { select: { code: true, name: true } } } } },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendanceRecord.count({ where }),
  ])

  // Summary across ALL records (not just current page)
  const allStatuses = await prisma.attendanceRecord.groupBy({
    by: ['status'],
    where,
    _count: true,
  })
  const present = allStatuses.find((s) => s.status === 'PRESENT')?._count ?? 0
  const absent = total - present
  const rate = total > 0 ? Math.round((present / total) * 100) : 0

  return apiSuccess({
    records,
    summary: { total, present, absent, rate },
    meta: { page, limit, totalPages: Math.ceil(total / limit) },
  })
})
