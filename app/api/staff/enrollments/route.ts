import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiPaginated, withErrorHandler } from '@/lib/api/response'
import { parsePagination, parseSearch } from '@/lib/api/response'

// GET /api/staff/enrollments
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)
  const search = parseSearch(searchParams)
  const statusFilter = searchParams.get('status')

  const where: any = {}
  if (statusFilter) where.status = statusFilter
  if (search) {
    where.OR = [
      { user: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
      { user: { profile: { lastName: { contains: search, mode: 'insensitive' } } } },
      { course: { code: { contains: search, mode: 'insensitive' } } },
      { course: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: {
        user: { include: { profile: { select: { firstName: true, lastName: true } }, studentProfile: { select: { studentId: true } } } },
        course: { select: { code: true, name: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.enrollment.count({ where }),
  ])

  return apiPaginated(enrollments, total, page, limit)
})

