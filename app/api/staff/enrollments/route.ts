import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiPaginated, withErrorHandler, parsePagination, parseSearch } from '@/lib/api/response'
import { buildOrderBy } from '@/lib/utils/build-order-by'

const ALLOWED_SORT_KEYS = {
  student: 'user.profile.lastName',
  course: 'course.name',
  status: 'status',
  enrolledAt: 'enrolledAt',
  amount: 'amountPaid',
} as const
type SortKey = keyof typeof ALLOWED_SORT_KEYS

// GET /api/staff/enrollments
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)
  const search = parseSearch(searchParams)
  const statusFilter = searchParams.get('status')
  const orderBy = buildOrderBy<SortKey>(
    { sort: searchParams.get('sort'), order: searchParams.get('order') },
    ALLOWED_SORT_KEYS,
    { createdAt: 'desc' }
  )

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
    prismaUnfiltered.enrollment.findMany({
      where,
      include: {
        user: { include: { profile: { select: { firstName: true, lastName: true } }, studentProfile: { select: { studentId: true } } } },
        course: { select: { code: true, name: true, price: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prismaUnfiltered.enrollment.count({ where }),
  ])

  return apiPaginated(enrollments, total, page, limit)
})

