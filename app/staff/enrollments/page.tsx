import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import EnrollmentsTable from './_components/EnrollmentsTable'
import SearchInput from '@/components/SearchInput'
import { Metadata } from 'next'
import { EnrollmentStatus as PrismaEnrollmentStatus, Prisma } from '@prisma/client'
import { X } from 'lucide-react'
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
    status?: string
  }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const params = await searchParams
  const query = params.query?.trim() || undefined
  const VALID_ENROLLMENT_STATUSES = new Set(Object.values(PrismaEnrollmentStatus))
  const status =
    params.status && VALID_ENROLLMENT_STATUSES.has(params.status.trim() as PrismaEnrollmentStatus)
      ? params.status.trim()
      : undefined
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '25', 10) || 25))
  const skip = (page - 1) * limit

  const where =
    query || status
      ? {
          AND: [
            query
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
              : undefined,
            status ? { status: status as PrismaEnrollmentStatus } : undefined,
          ].filter(Boolean),
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

      {status && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-900/20"
        >
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            Filtering by:
          </span>
          <span className="bg-aerojet-blue rounded-full px-2.5 py-1 text-xs font-bold tracking-wide text-white uppercase">
            {status}
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {total} {total === 1 ? 'result' : 'results'}
          </span>
          <Link
            href="/staff/enrollments"
            className="focus-visible:outline-aerojet-blue ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-blue-300 dark:hover:bg-blue-900/40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </Link>
        </div>
      )}

      <EnrollmentsTable enrollments={serializedEnrollments} total={total} />
    </div>
  )
}
