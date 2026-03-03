import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  Users,
  Plus,
  Settings,
  AlertTriangle,
  Download,
} from 'lucide-react'
import prisma from '@/lib/prisma/client'
import { format } from 'date-fns'
import { Metadata } from 'next'
import PoolStatusBadge from '../../../_components/PoolStatusBadge'
import { evaluateGoNoGo } from '@/lib/events/go-no-go'
import EventOverrideControls from './EventOverrideControls'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const event = await prisma.examEvent.findUnique({ where: { id } })
  return { title: `${event?.name || 'Event Details'} | Staff Portal` }
}

export default async function ExamEventDetailPage({ params }: PageProps) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params
  const event = await prisma.examEvent.findUnique({
    where: { id },
    include: {
      pools: {
        include: {
          _count: { select: { memberships: true } },
        },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!event) notFound()

  const evaluation = await evaluateGoNoGo(id).catch(() => null)

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <Link
          href="/staff/exams/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#002a5c] dark:text-slate-400"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Events
        </Link>
      </div>

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
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
              {format(event.startDate, 'EEEE, MMM d, yyyy')}
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              Start: {format(event.startDate, 'h:mm a')}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/staff/exams/events/${event.id}/edit`}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          >
            <Settings className="h-4 w-4" />
            Edit Event
          </Link>
          <EventOverrideControls eventId={event.id} currentOverride={event.overrideStatus} />
          <Link
            href={`/staff/exams/events/${event.id}/pools/create`}
            className="flex items-center gap-2 rounded-xl bg-[#002a5c] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#002a5c]/90"
          >
            <Plus className="h-4 w-4" />
            Add Pool
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Statistics or Key Dates */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
              Event Details
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase">Go/No-Go Decision</div>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {event.paymentDeadline ? format(event.paymentDeadline, 'MMM d, yyyy') : 'Not set'}
                </div>
              </div>
              <div className="border-t border-slate-50 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Total Pools</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {event.pools.length}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Total Candidates
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {event.pools.reduce((acc, p) => acc + p.currentMemberCount, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {evaluation && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                Revenue Tracking
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      Confirmed
                    </span>
                    <span className="text-sm font-black text-[#002a5c] dark:text-blue-400">
                      €{evaluation.metrics.totalConfirmedRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Target</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      €{evaluation.metrics.revenueTarget.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${evaluation.metrics.revenueMetPercent >= 100 ? 'bg-green-500' : 'bg-[#002a5c]'}`}
                      style={{ width: `${Math.min(100, evaluation.metrics.revenueMetPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-4">
                  <div className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    Go/No-Go Projection
                  </div>
                  <div
                    className={`rounded-lg p-3 text-sm font-medium ${
                      evaluation.decision === 'GO'
                        ? 'border border-green-200 bg-green-50 text-green-700'
                        : evaluation.decision === 'NO_GO'
                          ? 'border border-red-200 bg-red-50 text-red-700'
                          : 'border border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {evaluation.decision === 'GO'
                      ? 'Ready for confirmation'
                      : evaluation.decision === 'NO_GO'
                        ? 'Cancellation criteria met'
                        : 'Needs manual review'}
                  </div>
                  <ul className="mt-3 space-y-1 text-xs text-slate-500">
                    {evaluation.reasons.map((reason: string, idx: number) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-0.5">•</span>
                        <span dangerouslySetInnerHTML={{ __html: reason }} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pool Management */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Exam Pools</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {event.pools.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                    <Users className="h-5 w-5 text-slate-300" />
                  </div>
                  <p className="text-sm">No seating pools created for this event yet.</p>
                </div>
              ) : (
                event.pools.map((pool) => (
                  <div
                    key={pool.id}
                    className="flex flex-col justify-between gap-4 px-6 py-5 md:flex-row md:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                          {pool.name}
                        </h3>
                        <PoolStatusBadge status={pool.status} />
                      </div>
                      <div className="mt-1 flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {pool.currentMemberCount} / {pool.maxCandidates} Capacity
                        </span>
                        {pool.allowedModules.length > 0 && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            {pool.allowedModules.length} Modules Allowed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/api/staff/reports/roster/${pool.id}`}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        title="Download CSV Roster"
                      >
                        <Download className="h-3 w-3" />
                        Roster
                      </a>
                      <Link
                        href={`/staff/exams/pools/${pool.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                      >
                        Manage
                      </Link>
                      <Link
                        href={`/staff/exams/pools/${pool.id}/edit`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                      >
                        Settings
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
