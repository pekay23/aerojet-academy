import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import EnrollmentsTable from './_components/EnrollmentsTable'
import SearchInput from '@/components/SearchInput'
import { Metadata } from 'next'
import { Prisma } from '@prisma/client'
import type { EnrollmentWithDetails } from './_components/EnrollmentsTable'
import { buildOrderBy } from '@/lib/utils/build-order-by'

export const metadata: Metadata = { title: 'Enrollments | Staff Portal' }

const ALLOWED_SORT_KEYS = {
  student: 'user.profile.lastName',
  course: 'course.name',
  status: 'status',
  enrolledAt: 'enrolledAt',
  amount: 'amountPaid',
} as const

type SortKey = keyof typeof ALLOWED_SORT_KEYS

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string
    page?: string
    limit?: string
    sort?: string
    order?: string
  }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const params = await searchParams
  const query = params.query?.trim() || undefined
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '25', 10) || 25))
  const skip = (page - 1) * limit

  const where = query
    ? {
        OR: [
          {
            user: {
              OR: [
                { email: { contains: query, mode: 'insensitive' } },
                { profile: { firstName: { contains: query, mode: 'insensitive' } } },
                { profile: { lastName: { contains: query, mode: 'insensitive' } } },
              ],
            },
          },
          { course: { name: { contains: query, mode: 'insensitive' } } },
          { course: { code: { contains: query, mode: 'insensitive' } } },
        ],
      }
    : undefined

  const orderBy = buildOrderBy<SortKey>(params, ALLOWED_SORT_KEYS, { createdAt: 'desc' })

  const [enrollments, total] = await Promise.all([
    prismaUnfiltered.enrollment.findMany({
      where: where as unknown as Prisma.EnrollmentWhereInput,
      orderBy: orderBy as unknown as Prisma.EnrollmentOrderByWithRelationInput,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        course: true,
      },
      take: limit,
      skip,
    }),
    prismaUnfiltered.enrollment.count({ where: where as unknown as Prisma.EnrollmentWhereInput }),
  ])

  const serializedEnrollments = serializePrisma(enrollments) as unknown as EnrollmentWithDetails[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
            Enrollments
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage student course enrollments</p>
        </div>
        <div className="w-72">
          <SearchInput id="enrollments-search" placeholder="Search student or course..." />
        </div>
      </div>

      <EnrollmentsTable enrollments={serializedEnrollments} />
    </div>
  )
}
