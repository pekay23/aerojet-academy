import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import StaffExamsTabs from '../_components/StaffExamsTabs'
import ExamBookingsTable from '../_components/ExamBookingsTable'
import RecordsTab from './_components/RecordsTab'
import { getAvailableModules } from '../actions'
import Link from 'next/link'
import SearchInput from '@/components/SearchInput'
import { format } from 'date-fns'
import {
  Plus,
  Calendar,
  FileCheck,
  Clock,
  ClipboardList,
  CreditCard,
  Trophy,
  BookOpen,
} from 'lucide-react'

import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Exams | Staff Portal' }
export const dynamic = 'force-dynamic'

/** Reusable Prisma search filter for exam component code (searches both component code and parent course code) */
function examComponentCodeFilter(query: string) {
  return {
    exam: {
      examComponent: {
        OR: [
          { code: { contains: query, mode: 'insensitive' as const } },
          { course: { code: { contains: query, mode: 'insensitive' as const } } },
        ],
      },
    },
  }
}

/** Reusable Prisma search filter for user by email/name */
function userSearchFilter(query: string) {
  return {
    user: {
      OR: [
        { email: { contains: query, mode: 'insensitive' as const } },
        { profile: { firstName: { contains: query, mode: 'insensitive' as const } } },
        { profile: { lastName: { contains: query, mode: 'insensitive' as const } } },
      ],
    },
  }
}

const VALID_TABS = ['events', 'bookings', 'results', 'records']

export default async function StaffExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; query?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const params = await searchParams
  const tab = VALID_TABS.includes(params.tab ?? '') ? params.tab! : 'events'

  return (
    <StaffExamsTabs>
      {tab === 'events' && <EventsTab query={params.query} />}
      {tab === 'bookings' && <BookingsTab query={params.query} />}
      {tab === 'results' && <ResultsTab query={params.query} />}
      {tab === 'records' && <RecordsTabServer query={params.query} />}
    </StaffExamsTabs>
  )
}

/* ─── Events Tab ─── */
async function EventsTab({ query }: { query?: string }) {
  const events = await prisma.examEvent.findMany({
    where: query
      ? { name: { contains: query, mode: 'insensitive' } }
      : undefined,
    include: {
      pools: { select: { currentMemberCount: true, maxCandidates: true } },
      _count: { select: { pools: true } },
    },
    orderBy: { startDate: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="w-full max-w-sm">
          <SearchInput placeholder="Search events..." />
        </div>
        <Link
          href="/staff/exams/events/create"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#002a5c] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#002a5c]/90"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
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
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      No exam events found
                    </h3>
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
                    <tr
                      key={event.id}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {event.name}
                        </div>
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
                          {format(event.startDate, 'MMM d')} –{' '}
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
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50"
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

/* ─── Bookings Tab ─── */
async function BookingsTab({ query }: { query?: string }) {
  const bookings = await prisma.examBooking.findMany({
    where: query
      ? {
          OR: [
            userSearchFilter(query),
            { moduleCode: { contains: query, mode: 'insensitive' } },
            { event: { name: { contains: query, mode: 'insensitive' } } },
            examComponentCodeFilter(query),
          ],
        }
      : undefined,
    include: {
      user: { include: { profile: { select: { firstName: true, lastName: true } } } },
      event: { select: { name: true, startDate: true } },
      exam: {
        select: {
          name: true,
          examDate: true,
          examComponent: { select: { course: { select: { code: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="w-full max-w-sm">
          <SearchInput placeholder="Search students, modules, or events..." />
        </div>
      </div>

      <ExamBookingsTable bookings={bookings} />
    </div>
  )
}

/* ─── Results Tab ─── */
async function ResultsTab({ query }: { query?: string }) {
  const [formalResults, manualResults] = await Promise.all([
    prisma.examResult.findMany({
      where: query
        ? {
            OR: [userSearchFilter(query), examComponentCodeFilter(query)],
          }
        : undefined,
      include: {
        user: { include: { profile: { select: { firstName: true, lastName: true } } } },
        exam: {
          include: {
            examComponent: { include: { course: { select: { name: true, code: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.examBooking.findMany({
      where: {
        status: 'COMPLETED' as const,
        ...(query
          ? {
              OR: [
                userSearchFilter(query),
                { moduleCode: { contains: query, mode: 'insensitive' } },
                examComponentCodeFilter(query),
              ],
            }
          : {}),
      },
      include: {
        user: { include: { profile: { select: { firstName: true, lastName: true } } } },
        exam: {
          include: {
            examComponent: { include: { course: { select: { name: true, code: true } } } },
          },
        },
      },
      orderBy: { examDate: 'desc' },
    }),
  ])

  // Unify results
  const allResults = [
    ...formalResults.map((r) => ({
      id: r.id,
      type: 'FORMAL' as const,
      user: r.user,
      moduleCode: r.exam.examComponent?.course?.code || '—',
      examName: r.exam.name,
      date: r.exam.examDate,
      score: Number(r.score),
      passed: r.passed,
      certificateUrl: r.certificateUrl,
    })),
    ...manualResults.map((r) => ({
      id: r.id,
      type: 'MANUAL' as const,
      user: r.user,
      moduleCode: r.moduleCode || '—',
      examName: r.exam?.name || 'Manual Record',
      date: r.examDate || r.bookedAt,
      score: r.score ? Number(r.score) : null,
      passed: r.result === 'PASS',
      certificateUrl: null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="w-full max-w-sm">
          <SearchInput placeholder="Search students, exams, or modules..." />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Module / Exam</th>
                <th className="px-6 py-4 text-center">Date</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4 text-center">Type</th>
                <th className="px-6 py-4">Result</th>
                <th className="px-6 py-4 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                      <Trophy className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      No results found
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {query
                        ? 'Try adjusting your search terms.'
                        : 'Results will appear here once exams are completed and graded.'}
                    </p>
                  </td>
                </tr>
              ) : (
                allResults.map((result) => (
                  <tr
                    key={result.id}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-[#002a5c]">
                          {result.user.profile?.firstName?.charAt(0)}
                          {result.user.profile?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {result.user.profile?.firstName} {result.user.profile?.lastName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {result.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[#002a5c]" />
                        <span className="font-medium text-slate-700">
                          {result.moduleCode} - {result.examName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {result.date ? format(new Date(result.date), 'MMM d, yyyy') : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {result.score !== null ? `${result.score}%` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                          result.type === 'FORMAL'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {result.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {result.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {result.certificateUrl ? (
                        <a
                          href={result.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#002a5c] hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Not available</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─── Records Tab (Server Component Wrapper) ─── */
async function RecordsTabServer({ query }: { query?: string }) {
  const [records, modules] = await Promise.all([
    prisma.examBooking.findMany({
      where: query
        ? {
            OR: [userSearchFilter(query), { moduleCode: { contains: query, mode: 'insensitive' } }],
          }
        : undefined,
      include: {
        user: {
          include: {
            profile: { select: { firstName: true, middleName: true, lastName: true } },
            studentProfile: { select: { studentId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    getAvailableModules(),
  ])

  const serialized = records.map((recordRaw) => {
    const r: any = recordRaw
    return {
      id: r.id,
      courseId: r.courseId,
      moduleCode: r.moduleCode,
      examDate: r.examDate,
      bookedAt: r.bookedAt,
      status: r.status,
      result: r.result,
      score: r.score ? Number(r.score) : null,
      percentage: r.percentage ? Number(r.percentage) : null,
      attemptType: r.attemptType,
      sourceNotes: r.sourceNotes,
      user: {
        email: r.user.email,
        profile: r.user.profile,
        studentProfile: r.user.studentProfile,
      },
    }
  })

  return <RecordsTab records={serialized} modules={modules} />
}
