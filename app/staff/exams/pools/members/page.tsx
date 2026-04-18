import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import Link from 'next/link'
import { ChevronLeft, Users, BookOpen, Search, Filter, Calendar } from 'lucide-react'
import SearchInput from '@/components/SearchInput'

export const metadata: Metadata = { title: 'Booking Members Report | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function PoolMembersReportPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const params = await searchParams
  const query = params.query?.toLowerCase()

  const events = await prisma.examEvent.findMany({
    where: {
      pools: {
        some: {},
      },
    },
    include: {
      pools: {
        include: {
          memberships: {
            where: query
              ? {
                  OR: [
                    { user: { profile: { firstName: { contains: query, mode: 'insensitive' } } } },
                    { user: { profile: { lastName: { contains: query, mode: 'insensitive' } } } },
                    { user: { email: { contains: query, mode: 'insensitive' } } },
                    {
                      user: {
                        studentProfile: { studentId: { contains: query, mode: 'insensitive' } },
                      },
                    },
                  ],
                }
              : undefined,
            include: {
              user: {
                include: {
                  profile: { select: { firstName: true, lastName: true } },
                  studentProfile: { select: { studentId: true } },
                },
              },
              examComponent: {
                include: { course: { select: { code: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  })

  // Filter out events/pools with no matching members after query
  const filteredEvents = events
    .map((event) => ({
      ...event,
      pools: event.pools
        .map((pool) => ({
          ...pool,
          memberships: pool.memberships,
        }))
        .filter((pool) => pool.memberships.length > 0),
    }))
    .filter((event) => event.pools.length > 0)

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/staff/exams"
            className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-aerojet-blue dark:text-slate-400"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Exams
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Booking Members Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A comprehensive list of all students across all active exam bookings and their respective
            modules.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <SearchInput placeholder="Search students by name, email, or ID..." />
        </div>
      </div>

      <div className="space-y-12">
        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center dark:border-slate-800 dark:bg-slate-900">
            <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No members found</h3>
            <p className="text-sm text-slate-500">
              {query
                ? 'No students match your search query.'
                : 'There are currently no students booked into any exam bookings.'}
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{event.name}</h2>
                  <p className="text-xs font-medium text-slate-500">
                    {new Date(event.startDate).toLocaleDateString()} -{' '}
                    {new Date(event.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid gap-6">
                {event.pools.map((pool) => (
                  <div
                    key={pool.id}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="bg-slate-50/50 px-6 py-4 dark:bg-slate-800/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-slate-900 dark:text-white">{pool.name}</h3>
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-400">
                            {pool.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400">
                          {pool.memberships.length} Members
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
                          <tr>
                            <th className="px-6 py-3">Student</th>
                            <th className="px-6 py-3">Module / Component</th>
                            <th className="px-6 py-3">Booking Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {pool.memberships.map((member) => (
                            <tr
                              key={member.id}
                              className="group transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-aerojet-blue dark:bg-slate-800 dark:text-blue-400">
                                    {member.user.profile?.firstName?.charAt(0)}
                                    {member.user.profile?.lastName?.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-slate-900 dark:text-white">
                                      {member.user.profile?.firstName}{' '}
                                      {member.user.profile?.lastName}
                                    </p>
                                    <p className="truncate text-[10px] text-slate-500">
                                      {member.user.studentProfile?.studentId || 'N/A'} •{' '}
                                      {member.user.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-slate-400" />
                                  <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {member.examComponent?.course?.code || '—'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                    member.status === 'CONFIRMED'
                                      ? 'bg-green-100 text-green-700'
                                      : member.status === 'RESERVED'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {member.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Link
                                  href={`/staff/exams/pools/${pool.id}`}
                                  className="text-xs font-bold text-aerojet-blue underline-offset-4 hover:underline dark:text-blue-400"
                                >
                                  Manage
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
