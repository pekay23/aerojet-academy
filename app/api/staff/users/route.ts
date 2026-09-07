import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { UserRole, UserStatus, type Prisma } from '@prisma/client'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiPaginated, apiUnauthorized } from '@/lib/api/response'
import { buildOrderBy } from '@/lib/utils/build-order-by'

const ALLOWED_SORT_KEYS = {
  name: 'profile.lastName',
  role: 'role',
  status: 'status',
  joined: 'createdAt',
} as const
type SortKey = keyof typeof ALLOWED_SORT_KEYS

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return apiUnauthorized()

  const staffRoles = ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER']
  if (!staffRoles.includes(session.user.role)) return apiUnauthorized()

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') || 'all'
  const status = searchParams.get('status') || 'all'
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const orderBy = buildOrderBy<SortKey>(
    { sort: searchParams.get('sort'), order: searchParams.get('order') },
    ALLOWED_SORT_KEYS,
    { createdAt: 'desc' }
  )

  const where: Prisma.UserWhereInput = {}
  if (role !== 'all' && Object.values(UserRole).includes(role as UserRole)) {
    where.role = role as UserRole
  }

  if (status === 'all') {
    where.status = { notIn: ['ARCHIVED', 'DELETED'] }
  } else {
    if (Object.values(UserStatus).includes(status as UserStatus)) {
      where.status = status as UserStatus
    }
  }
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { profile: { firstName: { contains: search, mode: 'insensitive' } } },
      { profile: { lastName: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [users, total] = await Promise.all([
    prismaUnfiltered.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        personalEmail: true,
        academyEmail: true,
        role: true,
        status: true,
        emailVerified: true,
        mustChangePassword: true,
        createdAt: true,
        profile: {
          select: { firstName: true, lastName: true, phone: true, profilePhotoUrl: true },
        },
        ...(role === 'INSTRUCTOR'
          ? {
              instructorProfile: { select: { employeeId: true, specialization: true } },
            }
          : role === 'EXAMINER'
            ? {
                examinerProfile: {
                  select: { id: true, isActive: true, maxParallelSittings: true, notes: true },
                },
              }
            : {}),
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prismaUnfiltered.user.count({ where }),
  ])

  return apiPaginated(users, total, page, limit)
}
