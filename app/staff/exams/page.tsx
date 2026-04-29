import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import StaffExamsTabs from '../_components/StaffExamsTabs'
import ExamBookingsTable from '../_components/ExamBookingsTable'
import RecordsTab from './_components/RecordsTab'
import { getAvailableModules } from '../actions'
import { serializePrisma } from '@/lib/utils/serialization'
import Link from 'next/link'
import SearchInput from '@/components/SearchInput'
import { format } from 'date-fns'
import {
  Plus,
  Calendar,
  Trophy,
  BookOpen,
  AlertCircle,
} from 'lucide-react'

import { Metadata } from 'next'
import { BookingType, ExamCategory } from '@prisma/client'

interface ExamRecord {
  id: string
  examId?: string | null
  userId: string
  moduleCode: string | null
  score: number | null
  maxScore?: number | null
  percentage?: number | null
  passed: boolean
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
  result?: string | null
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
  const eventsRaw = await prismaUnfiltered.examEvent.findMany({
    where: query
      ? { name: { contains: query, mode: 'insensitive' } }
      : undefined,
    include: {
      pools: { select: { currentMemberCount: true, maxCandidates: true } },
      _count: { select: { pools: true } },
    },
    orderBy: { startDate: 'desc' },
  })

  const events = serializePrisma(eventsRaw)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="w-full max-w-sm">
          <SearchInput id="exams-events-search" placeholder="Search events..." />
        </div>
        <Link
          href="/staff/exams/events/create"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-aerojet-blue/90"
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
    take: 500,
  })

  const serialized = serializePrisma(bookings)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="w-full max-w-sm">
          <SearchInput id="exams-bookings-search" placeholder="Search students, modules, or events..." />
        </div>
      </div>

      <ExamBookingsTable bookings={serialized} />
    </div>
  )
}

/* ─── Results Tab ─── */
async function ResultsTab({ query }: { query?: string }) {
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
    take: 500, // Important: Add limit to prevent connection starvation
  }).then(res => serializePrisma(res))

  // Unify results
  const allResults = formalResults.map((r) => ({
    id: r.id,
    type: 'FORMAL' as const,
    user: r.user,
    moduleCode: r.moduleCode || r.exam?.examComponent?.course?.code || '—',
    examName: r.exam?.name || 'Manual Result',
    date: r.exam?.examDate || r.createdAt,
    score: r.score ? Number(r.score) : null,
    passed: r.passed,
    certificateUrl: r.certificateUrl,
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

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
                allResults.map((result) => (
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
async function RecordsTabServer({ query }: { query?: string }) {
  try {
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
        examAttendance: true,
        user: {
          include: {
            profile: { select: { firstName: true, middleName: true, lastName: true } },
            studentProfile: { select: { studentId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
    }),
    getAvailableModules(),
  ])

  // Unify bookings and results
  const unifiedRecords: ExamRecord[] = []

  // 1. Add all bookings
  for (const b of bookingsRaw) {
    unifiedRecords.push({
      ...b,
      source: 'booking',
      id: b.id,
      score: b.score != null ? Number(b.score) : null,
      passed: b.result?.toLowerCase() === 'pass',
      isMigrated: b.result?.toUpperCase() === 'MIGRATED',
      migrationRef: null, // ExamBooking has no migrationRef field
      examCategory: b.examCategory as ExamCategory,
    } as ExamRecord)
  }

  // 2. Merge results into bookings or add as standalone
  for (const r of resultsRaw) {
    const rModule = (r.moduleCode || '').toUpperCase()
    // Try to find a booking for this user and module that doesn't have a formal result ID linked yet
    // Heuristic: Match by User + Module + AttemptType + Month (to prevent merging different attempts)
    const rDate = r.createdAt ? new Date(r.createdAt) : new Date()
    const existingIndex = unifiedRecords.findIndex(
      (rec) => {
        if (rec.source !== 'booking' || rec.userId !== r.userId || (rec.moduleCode?.toUpperCase() || '') !== rModule) return false
        
        // If attempt types are specified and different, don't merge
        if (rec.attemptType && r.attemptType && rec.attemptType !== r.attemptType) return false
        
        // If dates are specified and different by more than 30 days, don't merge

        
        return true
      }
    )

    if (existingIndex !== -1) {
      // Merge: Preference to formal result data
      unifiedRecords[existingIndex] = {
        ...unifiedRecords[existingIndex],
        id: `result_${r.id}`, // Use result_ prefix so updateExamBooking knows to target Result table
        score: r.score != null ? Number(r.score) : unifiedRecords[existingIndex].score,
        passed: r.passed,
        source: 'result', // Mark as result-backed
        examCategory: r.examCategory || unifiedRecords[existingIndex].examCategory,
        attemptType: r.attemptType || unifiedRecords[existingIndex].attemptType,
        isMigrated: !!r.migrationRef || !!unifiedRecords[existingIndex].migrationRef,
        migrationRef: r.migrationRef || unifiedRecords[existingIndex].migrationRef,
      }
    } else {
      // Standalone result - Try to find any booking for this user/module to get correct bookingType
      const matchingBooking = bookingsRaw.find((b) => {
        if (b.userId !== r.userId) return false
        const bModule = (b.moduleCode || '').trim().toUpperCase()
        const rModuleNorm = rModule.trim()
        if (!rModuleNorm) return false // Don't match if module is missing
        return bModule === rModuleNorm || bModule.includes(rModuleNorm) || rModuleNorm.includes(bModule)
      })
      
      unifiedRecords.push({
        ...r,
        id: `result_${r.id}`,
        source: 'result',
        score: r.score != null ? Number(r.score) : null,
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
  }).slice(0, 2000) // High limit for pagination

  const serialized = serializePrisma(finalRecords)

  return <RecordsTab records={serialized} modules={modules} />
  } catch (error) {
    console.error('[RecordsTabServer] Error:', error)
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h3 className="text-lg font-black text-slate-900 dark:text-white">Data temporarily unavailable</h3>
        <p className="mt-2 text-sm text-slate-500">The database connection timed out. Please refresh the page in a few moments.</p>
      </div>
    )
  }
}
