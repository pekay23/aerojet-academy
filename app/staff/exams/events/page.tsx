import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, MapPin, FileCheck, Clock } from 'lucide-react'
import prisma from '@/lib/prisma/client'
import { format } from 'date-fns'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Exam Events | Staff Portal' }

export default async function ExamEventsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const events = await prisma.examEvent.findMany({
    include: {
      pools: {
        select: {
          currentMemberCount: true,
          maxCandidates: true,
        },
      },
      _count: {
        select: { pools: true },
      },
    },
    orderBy: { startDate: 'desc' },
  })

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Exam Events</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage exam sessions and seating pools</p>
        </div>
        <Link
          href="/staff/exams/events/create"
          className="flex items-center gap-2 rounded-xl bg-[#002a5c] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#002a5c]/90"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date & Venue</th>
                <th className="px-6 py-4">Pools / Candidates</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                      <Calendar className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No exam events found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Create your first exam event to start managing bookings.
                    </p>
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const totalCandidates = event.pools.reduce(
                    (acc, pool) => acc + pool.currentMemberCount,
                    0
                  )
                  const totalCapacity = event.pools.reduce(
                    (acc, pool) => acc + pool.maxCandidates,
                    0
                  )

                  return (
                    <tr key={event.id} className="group hover:bg-slate-50 dark:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{event.name}</div>
                        {/* Description removed as it's not in schema */}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                            event.status === 'OPEN'
                              ? 'bg-green-100 text-green-700'
                              : event.status === 'CONFIRMED'
                                ? 'bg-blue-100 text-blue-700'
                                : event.status === 'DRAFT'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {format(event.startDate, 'MMM d')} -{' '}
                          {format(event.endDate, 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">{event._count.pools} Pools</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {totalCandidates} / {totalCapacity} Candidates
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/staff/exams/events/${event.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

