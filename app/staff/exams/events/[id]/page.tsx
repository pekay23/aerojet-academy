import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
export const dynamic = 'force-dynamic'
import Link from 'next/link'

import {
  Calendar,
  Clock,
  ChevronLeft,
  Plus,
  Settings,
  Armchair,
} from 'lucide-react'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { format } from 'date-fns'
import { Metadata } from 'next'
import { evaluateGoNoGo } from '@/lib/events/go-no-go'
import { getEventDemandSnapshot } from '@/lib/exams/demand'
import EventOverrideControls from './EventOverrideControls'
import GenerateSittingsButton from './GenerateSittingsButton'
import SchedulingWarningsPanel from './SchedulingWarningsPanel'
import ResitBackfillPanel from './ResitBackfillPanel'
import PoolList from './PoolList'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const event = await prismaUnfiltered.examEvent.findUnique({ where: { id } })
  return { title: `${event?.name || 'Event Details'} | Staff Portal` }
}

export default async function ExamEventDetailPage({ params }: PageProps) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params
  const event = await prismaUnfiltered.examEvent.findUnique({
    where: { id },
    include: {
      pools: {
        include: {
          _count: { select: { memberships: true } },
        },
        orderBy: { name: 'asc' },
      },
      sittings: {
        include: {
          examComponent: { include: { course: true } },
          _count: { select: { assignments: true } },
        },
        orderBy: [{ dayNumber: 'asc' }, { sessionType: 'asc' }, { startTime: 'asc' }],
      },
    },
  })

  if (!event) notFound()

  // Serialize pools safely (Next.js cannot serialize Prisma.Decimal to Client Components)
  // Use a minification-safe check for Decimal types
  const serializablePools = JSON.parse(
    JSON.stringify(event.pools, (_key, value) => {
      // Check for Prisma.Decimal or any object that looks like one (minification safe)
      if (value && typeof value === 'object' && ('d' in value && 's' in value && 'e' in value)) {
        return Number(value)
      }
      return value
    })
  )

  const [_evaluation, demandSnapshot] = await Promise.all([
    evaluateGoNoGo(id, { unfiltered: true }).catch(() => null),
    getEventDemandSnapshot(id),
  ])

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none px-6 py-4">
        <div className="mb-4">
          <Link
            href="/staff/exams/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-aerojet-blue dark:text-slate-400"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Events
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
                {event.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
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
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {event.startDate ? format(new Date(event.startDate), 'EEEE, MMM d, yyyy') : 'No Start Date'}
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                Start: {event.startDate ? format(new Date(event.startDate), 'h:mm a') : 'TBD'}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <GenerateSittingsButton eventId={event.id} />
            <Link
              href={`/staff/exams/events/${event.id}/edit`}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600"
            >
              <Settings className="h-4 w-4" />
              Edit Event
            </Link>
            <EventOverrideControls eventId={event.id} currentOverride={event.overrideStatus} />
            <Link
              href={`/staff/exams/events/${event.id}/pools/create`}
              className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-aerojet-blue/90"
            >
              <Plus className="h-4 w-4" />
              Add Pool
            </Link>
          </div>
        </div>
      </div>

      {/* Two-Sided Scrollable Content */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="grid h-full gap-8 lg:grid-cols-3">
          {/* Left Column: Stats & Demand (Scrollable) */}
          <div className="h-full space-y-6 overflow-y-auto pr-2 [scrollbar-width:thin] lg:col-span-1">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                Event Details
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Payment Deadline</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {event.paymentDeadline ? format(event.paymentDeadline, 'MMM d, yyyy') : 'Not set'}
                  </div>
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Total Pools</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {event.pools.length}
                    </span>
                  </div>
                  <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Total Candidates
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {demandSnapshot?.totals.candidateCount || 0}
                    </span>
                  </div>
                  <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Seats in Pools
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {event.pools?.reduce((acc, p) => acc + (p.currentMemberCount || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Scheduled Sittings
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {event.sittings.length}
                    </span>
                  </div>
                  {demandSnapshot && (
                    <>
                      <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Total Demand
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {demandSnapshot.totals.bookingCount}
                        </span>
                      </div>
                      <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Guaranteed Seats
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {demandSnapshot.totals.guaranteedCount}
                        </span>
                      </div>
                      <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Paid Seat Volume
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {demandSnapshot.totals.paidSeatCount}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {demandSnapshot && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                  Demand Breakdown
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-bold tracking-widest text-slate-400 uppercase">
                      <span>Booking Types</span>
                      <span>Packages</span>
                    </div>
                    <div className="space-y-2">
                      {demandSnapshot.byBookingType.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          No booking demand captured yet.
                        </p>
                      ) : (
                        demandSnapshot.byBookingType.map((row) => (
                          <div key={row.bookingType} className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">
                              {row.bookingType.replaceAll('_', ' ')}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {row.count}
                              {row.guaranteedCount !== row.count && (
                                <span className="ml-2 text-xs font-medium text-slate-400">
                                  {row.guaranteedCount} guaranteed
                                </span>
                              )}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-50 pt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold tracking-widest text-slate-400 uppercase">
                      <span>Modules</span>
                      <span>Seats</span>
                    </div>
                    <div className="space-y-2">
                      {demandSnapshot.modules.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          No module demand captured yet.
                        </p>
                      ) : (
                        demandSnapshot.modules.slice(0, 8).map((module) => (
                          <div key={module.moduleCode} className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">{module.moduleCode}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {module.bookingCount}
                              {module.guaranteedCount !== module.bookingCount && (
                                <span className="ml-2 text-xs font-medium text-slate-400">
                                  {module.guaranteedCount} guaranteed
                                </span>
                              )}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {event.sittings.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                  Scheduled Sittings
                </h2>
                <div className="space-y-3">
                  {event.sittings.slice(0, 8).map((sitting) => (
                    <div
                      key={sitting.id}
                      className="rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {sitting.examComponent.course?.code || sitting.examComponent.code}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Day {sitting.dayNumber} · {sitting.sessionType} · {format(new Date(sitting.startTime), 'dd MMM yyyy, h:mm a')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/staff/exams/sittings/${sitting.id}/seating`}
                            className="flex items-center gap-1 text-xs font-bold text-aerojet-sky hover:text-aerojet-blue transition-colors"
                            title="Manage seating"
                          >
                            <Armchair className="h-3.5 w-3.5" />
                            Seats
                          </Link>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {sitting._count.assignments}/{sitting.capacity}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {sitting.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <SchedulingWarningsPanel eventId={event.id} />
          </div>

          {/* Right Column: Pool Management (Scrollable) */}
          <div className="h-full overflow-y-auto pr-2 [scrollbar-width:thin] lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Exam Bookings</h2>
                {event.pools.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {event.pools?.length || 0} pool{event.pools?.length !== 1 ? 's' : ''}
                    {' · '}
                    {event.pools?.reduce((a, p) => a + (p.currentMemberCount || 0), 0) || 0} in pools
                    {demandSnapshot ? ` · ${demandSnapshot.totals.bookingCount} total demand` : ''}
                    {' · '}
                    {event.pools?.filter((p) => (p.currentMemberCount || 0) >= (p.maxCandidates || 0)).length || 0} full
                  </p>
                )}
              </div>
              <div className="p-6 pb-0">
                <ResitBackfillPanel eventId={event.id} />
              </div>
              <PoolList pools={serializablePools} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
