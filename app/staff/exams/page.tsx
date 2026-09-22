import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import StaffExamsTabs from '../_components/StaffExamsTabs'
import ExamBookingsTable, { type ExamBookingWithDetails } from '../_components/ExamBookingsTable'
import RecordsTab from './_components/RecordsTab'
import { GroupCharterModal } from './_components/GroupCharterModal'
import { getAvailableModules } from '../actions/index'
import { serializePrisma } from '@/lib/utils/serialization'

import Link from 'next/link'
import SearchInput from '@/components/SearchInput'
import { format } from 'date-fns'
import {
  deriveBookingDisplayResult,
  fulfillmentStateLabel,
  type BookingFulfillmentState,
} from '@/lib/exams/fulfillment'
import {
  Plus,
  Calendar,
  Trophy,
  BookOpen,
  AlertCircle,
} from 'lucide-react'


import { BookingType, ExamCategory } from '@prisma/client'

type SerializedExamEvent = {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  pools: { currentMemberCount: number; maxCandidates: number }[]
  _count: { pools: number }
}

type CharterEvent = { id: string; name: string }
type CharterModule = { id: string; code: string; name: string }
type SerializedPool = { currentMemberCount: number; maxCandidates: number }

type SerializedFormalResult = {
  id: string
  user: {
    email: string
    profile: { firstName: string; lastName: string } | null
  }
  moduleCode: string | null
  exam: {
    name: string | null
    examDate: Date | string | null
    examComponent: {
      course: { code: string } | null
    } | null
  } | null
  score: number | string | null
  passed: boolean | null
  certificateUrl: string | null
  createdAt: Date | string
}

type FormalResultRow = {
  id: string
  type: 'FORMAL'
  user: SerializedFormalResult['user']
  moduleCode: string
  examName: string
  date: Date | string | null
  score: number | null
  passed: boolean | null
  certificateUrl: string | null
}

interface ExamRecord {
  id: string
  examId?: string | null
  userId: string
  moduleCode: string | null
  score: number | null
  maxScore?: number | null
  percentage?: number | null
  passed: boolean | null
  grade?: string | null
  attemptType: string | null
  bookingType: BookingType | string | null
  source: 'booking' | 'result'
  sourceNotes?: string | null
  examCategory: ExamCategory | string
  isMigrated: boolean
  migrationRef?: string | null
  certificateUrl?: string | null
  examDate?: Date | string | null
  dateDisplay?: string | null
  dateDisplayKind?: 'DATE' | 'TBC' | 'TBD'
  sittingLabel?: string | null
  result?: string | null
  displayResult?: string | null
  displayResultKind?: string | null
  createdAt: Date | string
  updatedAt?: Date | string
  user: {
    email: string
    profile: { firstName: string; middleName?: string | null; lastName: string } | null
    studentProfile: { studentId: string } | null
  }
}
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
  searchParams: Promise<{ tab?: string; query?: string; page?: string; limit?: string }>
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
  try {
    const eventsRaw = await prismaUnfiltered.examEvent.findMany({
      where: query
        ? { name: { contains: query, mode: 'insensitive' } }
        : undefined,
      include: {
        pools: { select: { currentMemberCount: true, maxCandidates: true } },
        _count: { select: { pools: true } },
      },
      orderBy: { startDate: 'desc' },
      take: 100,
    })
    const events = serializePrisma(eventsRaw)

    // Fetch open events and modules for Group Charter modal
    const [charterEvents, charterModules] = await Promise.all([
      prismaUnfiltered.examEvent.findMany({
        where: { status: { in: ['OPEN', 'DRAFT'] } },
        select: { id: true, name: true },
        orderBy: { startDate: 'asc' },
      }),
      prismaUnfiltered.examComponent.findMany({
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
      }),
    ])

    return (
      // eslint-disable-next-line react-hooks/error-boundaries
      <EventsTabContent
        events={events}
        charterEvents={charterEvents}
        charterModules={charterModules}
      />
    )
  } catch (error) {
    console.error('[EventsTab] Error:', error)
    return <DataUnavailableError />
  }
}

function EventsTabContent({
  events,
  charterEvents,
  charterModules,
}: {
  events: SerializedExamEvent[]
  charterEvents: CharterEvent[]
  charterModules: CharterModule[]
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="w-full max-w-sm">
          <SearchInput id="exams-events-search" placeholder="Search events..." />
        </div>
        <div className="flex gap-3">
          <GroupCharterModal
            events={charterEvents}
            modules={charterModules}
          />
          <Link
            href="/staff/exams/events/create"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-aerojet-blue/90"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        </div>
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
                events.map((event: SerializedExamEvent) => {
                  const totalCandidates = event.pools.reduce(
                    (acc: number, pool: SerializedPool) => acc + pool.currentMemberCount,
                    0
                  )
                  const totalCapacity = event.pools.reduce(
                    (acc: number, pool: SerializedPool) => acc + pool.maxCandidates,
                    0
                  )

                  return (
                    <tr
                      key={event.id}
                      className="group transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {event.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                            event.status === 'OPEN'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : event.status === 'CONFIRMED'
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : event.status === 'DRAFT'
                                  ? 'bg-slate-50 text-slate-500 border border-slate-100'
                                  : 'bg-red-50 text-red-600 border border-red-100'
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                          <Calendar className="h-3.5 w-3.5 text-aerojet-blue" />
                          {format(new Date(event.startDate), 'MMM d')} –{' '}
                          {format(new Date(event.endDate), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">{event._count.pools} Pools</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {totalCandidates} / {totalCapacity} Pool Occupancy
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/staff/exams/events/${event.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 shadow-sm transition-all hover:border-aerojet-blue/30 hover:bg-aerojet-blue/5 hover:text-aerojet-blue dark:border-slate-800 dark:bg-slate-900 dark:hover:border-aerojet-blue/50"
                        >
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
  try {
    const bookings = await prismaUnfiltered.examBooking.findMany({
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
        user: { include: { profile: { select: { firstName: true, middleName: true, lastName: true } } } },
        event: { select: { name: true, startDate: true, endDate: true } },
        exam: {
          select: {
            name: true,
            examDate: true,
            examComponent: { select: { course: { select: { code: true } } } },
          },
        },
        poolMemberships: {
          include: {
            pool: {
              select: {
                name: true,
                examDate: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    })

    const serialized = serializePrisma(bookings)

    // eslint-disable-next-line react-hooks/error-boundaries
    return <BookingsTabContent bookings={serialized} />
  } catch (error) {
    console.error('[BookingsTab] Error:', error)
    return <DataUnavailableError />
  }
}

function BookingsTabContent({ bookings }: { bookings: ExamBookingWithDetails[] }) {
  return (
    <div className="space-y-6">
      <ExamBookingsTable bookings={bookings} />
    </div>
  )
}

/* ─── Results Tab ─── */
async function ResultsTab({ query }: { query?: string }) {
  try {
    const formalResults = await prismaUnfiltered.examResult.findMany({
      where: query
        ? {
            OR: [
              userSearchFilter(query),
              examComponentCodeFilter(query),
              { moduleCode: { contains: query, mode: 'insensitive' } },
            ],
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
      take: 300,
    }).then(res => serializePrisma(res))

    // Unify results
    const allResults = formalResults.map((r: SerializedFormalResult) => ({
      id: r.id,
      type: 'FORMAL' as const,
      user: r.user,
      moduleCode: r.moduleCode || r.exam?.examComponent?.course?.code || '—',
      examName: r.exam?.name || 'Manual Result',
      date: r.exam?.examDate || r.createdAt,
      score: r.score ? Number(r.score) : null,
      passed: r.passed,
      certificateUrl: r.certificateUrl,
    })).sort((a: FormalResultRow, b: FormalResultRow) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0
      const bTime = b.date ? new Date(b.date).getTime() : 0
      return bTime - aTime
    })

    // eslint-disable-next-line react-hooks/error-boundaries
    return <ResultsTabContent allResults={allResults} query={query} />
  } catch (error) {
    console.error('[ResultsTab] Error:', error)
    return <DataUnavailableError />
  }
}

function ResultsTabContent({ allResults, query }: { allResults: FormalResultRow[]; query?: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="w-full max-w-sm">
          <SearchInput id="exams-results-search" placeholder="Search students, exams, or modules..." />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Module / Exam</th>
                <th className="px-6 py-4 text-center">Dates</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4 text-center">Type</th>
                <th className="px-6 py-4">Result</th>
                <th className="px-6 py-4 text-right"></th>
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
                allResults.map((result: FormalResultRow) => (
                  <tr
                    key={result.id}
                    className="group transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-aerojet-blue">
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
                        <BookOpen className="h-4 w-4 text-aerojet-blue" />
                        <span className="font-medium text-slate-700">
                          {result.moduleCode} - {result.examName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                          <Calendar className="h-3 w-3 text-aerojet-blue" />
                          {result.date ? format(new Date(result.date), 'MMM d, yyyy') : '—'}
                        </div>
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
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-aerojet-blue shadow-sm transition-all hover:border-aerojet-blue/30 hover:bg-aerojet-blue/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-aerojet-blue/50"
                        >
                          Certificate
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">N/A</span>
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
const FULFILLMENT_DISPLAY_STATES = new Set([
  'PENDING_POOL_CONFIRMATION',
  'PENDING_FULFILLMENT',
  'EXCUSED_PENDING_REBOOK',
  'SCHEDULED',
  'EXECUTED',
  'ROLLED_FORWARD',
  'POSTPONED',
  'CANCELLED',
])

function formatBookingDisplayResult(value: string | null) {
  if (!value) return null
  if (FULFILLMENT_DISPLAY_STATES.has(value)) {
    return fulfillmentStateLabel(value as BookingFulfillmentState)
  }
  return value.toUpperCase()
}

async function RecordsTabServer({
  query,
}: {
  query?: string
}) {
  try {
    // Fetch all records for server-side filtering - no skip, no fetchLimit
    // Client handles pagination after merging
    const [bookingsRaw, resultsRaw, modules] = await Promise.all([
      prismaUnfiltered.examBooking.findMany({
        where: query
          ? {
              OR: [
                userSearchFilter(query),
                { moduleCode: { contains: query, mode: 'insensitive' } },
              ],
            }
          : undefined,
        include: {
          examAttendance: {
            include: {
              sitting: true,
            },
          },
          sittingAssignments: {
            where: { status: { in: ['ASSIGNED', 'CONFIRMED', 'ATTENDED', 'ABSENT', 'EXCUSED'] } },
            include: { sitting: true },
            orderBy: { assignedAt: 'desc' },
          },
          user: {
            include: {
              profile: { select: { firstName: true, middleName: true, lastName: true } },
              studentProfile: { select: { studentId: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      prismaUnfiltered.examResult.findMany({
        where: query
          ? {
              OR: [
                userSearchFilter(query),
                { moduleCode: { contains: query, mode: 'insensitive' } },
              ],
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
        take: 500,
      }),
     getAvailableModules(),
  ])

  // Unify bookings and results
    const unifiedRecords: ExamRecord[] = []
    const bookingsMap = new Map<string, ExamRecord>()

    // 1. Add all bookings
    for (const b of bookingsRaw) {
      const activeAssignment = b.sittingAssignments?.[0] || null
      const sitting = activeAssignment?.sitting || b.examAttendance?.sitting || null
      const effectiveExamDate = sitting?.startTime || b.examDate || null
      const displayResultKind = deriveBookingDisplayResult({
        result: b.result,
        demandStatus: b.demandStatus,
        executedAt: b.executedAt,
        rolloverToEventId: b.rolloverToEventId,
        status: b.status,
      })
      const hasRealResult = ['pass', 'fail'].includes(b.result?.toLowerCase() || '')
      const dateDisplayKind = effectiveExamDate
        ? 'DATE'
        : (b.eventId || ['POOLED', 'SCHEDULED', 'POSTPONED'].includes(b.demandStatus))
          ? 'TBC'
          : 'TBD'

      const record = {
        ...b,
        source: 'booking' as const,
        id: b.id,
        score: b.score != null ? Number(b.score) : null,
        passed: hasRealResult
          ? b.result?.toLowerCase() === 'pass'
          : null,
        isMigrated: b.result?.toUpperCase() === 'MIGRATED',
        migrationRef: null,
        examCategory: b.examCategory as ExamCategory,
        examDate: effectiveExamDate,
        dateDisplay: effectiveExamDate ? format(new Date(effectiveExamDate), 'MMM d, yyyy') : dateDisplayKind,
        dateDisplayKind,
        sittingLabel: sitting ? `Day ${sitting.dayNumber} ${sitting.sessionType}` : null,
        displayResult: formatBookingDisplayResult(displayResultKind),
        displayResultKind,
      } as ExamRecord

      unifiedRecords.push(record)
      bookingsMap.set(`${b.userId}:${(b.moduleCode || '').toUpperCase()}`, record)
    }

    // 2. Merge results into bookings or add as standalone
    for (const r of resultsRaw) {
      const rModule = (r.moduleCode || '').toUpperCase()
      const mapKey = `${r.userId}:${rModule}`
      const existingRecord = bookingsMap.get(mapKey)

      if (existingRecord) {
        const existingIndex = unifiedRecords.findIndex((rec) => rec.id === existingRecord.id)
        if (existingIndex !== -1) {
          unifiedRecords[existingIndex] = {
            ...unifiedRecords[existingIndex],
            id: `result_${r.id}`,
            score: r.score != null ? Number(r.score) : unifiedRecords[existingIndex].score,
            passed: r.passed,
            source: 'result',
            result: r.passed ? 'PASS' : 'FAIL',
            displayResult: r.passed ? 'PASS' : 'FAIL',
            displayResultKind: r.passed ? 'PASS' : 'FAIL',
            examDate: unifiedRecords[existingIndex].examDate || r.createdAt,
            dateDisplayKind: 'DATE',
            dateDisplay: format(new Date(unifiedRecords[existingIndex].examDate || r.createdAt), 'MMM d, yyyy'),
            examCategory: r.examCategory || unifiedRecords[existingIndex].examCategory,
            attemptType: r.attemptType || unifiedRecords[existingIndex].attemptType,
            isMigrated: !!r.migrationRef || !!unifiedRecords[existingIndex].migrationRef,
            migrationRef: r.migrationRef || unifiedRecords[existingIndex].migrationRef,
          }
        }
      } else {
        const matchingBooking = bookingsRaw.find((b) => {
          if (b.userId !== r.userId) return false
          const bModule = (b.moduleCode || '').trim().toUpperCase()
          const rModuleNorm = rModule.trim()
          if (!rModuleNorm) return false
          return bModule === rModuleNorm || bModule.includes(rModuleNorm) || rModuleNorm.includes(bModule)
        })

        unifiedRecords.push({
          ...r,
          id: `result_${r.id}`,
          source: 'result',
          score: r.score != null ? Number(r.score) : null,
          result: r.passed ? 'PASS' : 'FAIL',
          displayResult: r.passed ? 'PASS' : 'FAIL',
          displayResultKind: r.passed ? 'PASS' : 'FAIL',
          examDate: r.createdAt,
          dateDisplayKind: 'DATE',
          dateDisplay: format(new Date(r.createdAt), 'MMM d, yyyy'),
          bookingType: matchingBooking?.bookingType || 'INDIVIDUAL',
          isMigrated: !!r.migrationRef,
          migrationRef: r.migrationRef,
          examCategory: r.examCategory || matchingBooking?.examCategory || 'OFFICIAL_EASA',
        } as ExamRecord)
      }
    }

    // Final sort and serialization
    const finalRecords = unifiedRecords.sort((a, b) => {
      const dateA = new Date(a.examDate || a.createdAt).getTime()
      const dateB = new Date(b.examDate || b.createdAt).getTime()
      if (dateB !== dateA) return dateB - dateA
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const serialized = serializePrisma(finalRecords)

    // eslint-disable-next-line react-hooks/error-boundaries
    return <RecordsTab records={serialized} modules={modules} totalCount={finalRecords.length} />
  } catch (error) {
    console.error('[RecordsTabServer] Error:', error)
    return <DataUnavailableError />
  }
}

function DataUnavailableError() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
      <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
      <h3 className="text-lg font-black text-slate-900 dark:text-white">Data temporarily unavailable</h3>
      <p className="mt-2 text-sm text-slate-500">The database connection timed out. Please refresh the page in a few moments.</p>
    </div>
  )
}
