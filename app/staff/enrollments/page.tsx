import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import EnrollmentsTable from './_components/EnrollmentsTable'
import SearchInput from '@/components/SearchInput'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Enrollments | Staff Portal' }

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { query } = await searchParams

  const enrollments = await prisma.enrollment.findMany({
    where: query
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
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      course: true,
    },
    take: 100,
  })

  const serializedEnrollments = serializePrisma(enrollments)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">Enrollments</h1>
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
