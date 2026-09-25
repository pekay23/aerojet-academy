import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import {
  ClipboardCheck,
  AlertCircle,
  FileBarChart2,
  History as HistoryIcon,
  RefreshCcw,
} from 'lucide-react'
import Link from 'next/link'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import ExamsTabs from './_components/ExamsTabs'
import ExamHistoryTable from './_components/ExamHistoryTable'
import {
  canAccessFeature,
  getEnrollmentMilestoneStatus,
  getStudentPaymentAccessLevel,
  getStudentStatus,
} from '@/lib/access-control'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'
import {
  deriveBookingDisplayResult,
  fulfillmentStateLabel,
  type BookingFulfillmentState,
} from '@/lib/exams/fulfillment'

// The newly extracted tabs
import MyBookingsTab from './_components/MyBookingsTab'
import ResitBookingTab from './_components/ResitBookingTab'
import BookExamTab from './_components/BookExamTab'
import { UnifiedExamRecord } from '@/lib/student/types'

export const metadata: Metadata = {
  title: 'My Exams | Student Portal',
  description: 'View your exam bookings, results, and history.',
}
export const dynamic = 'force-dynamic'

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

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  // Backward compatibility: map old tab names to new consolidated tab
  const LEGACY_TAB_MAP: Record<string, string> = {
    available: 'book',
    individual: 'book',
    group: 'book',
  }
  const tab = LEGACY_TAB_MAP[tabParam || ''] || tabParam || 'records'

  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  // getStudentStatus is React.cache'd, so these multiple calls will only result in 1 DB query
  const { isFullTime, isExamOnly, isModular } = await getStudentStatus(session.user.id)
  const hasAccess = await canAccessFeature(session.user.id, 'exams')

  if (isFullTime && !hasAccess) {
    const [milestoneStatus, wallet, accessLevel] = await Promise.all([
      getEnrollmentMilestoneStatus(session.user.id),
      prisma.wallet.findUnique({
        where: { userId: session.user.id },
        select: { availableBalance: true, reservedBalance: true, currency: true },
      }),
      getStudentPaymentAccessLevel(session.user.id),
    ])

    const walletBalance = {
      available: Number(wallet?.availableBalance ?? 0),
      held: Number(wallet?.reservedBalance ?? 0),
      currency: wallet?.currency ?? 'EUR',
    }

    return (
      <div className="space-y-8">
        <PaymentRequiredBanner
          accessLevel={accessLevel}
          milestoneStatus={milestoneStatus}
          walletBalance={walletBalance}
        />
      </div>
    )
  }

  // Common data for Records tab
  let bookings, results, examAttendances, studentProfile
  if (tab === 'records') {
    try {
      ;[bookings, results, examAttendances, studentProfile] = await Promise.all([
        prisma.examBooking.findMany({
          where: { userId: session.user.id },
          include: {
            exam: { include: { examComponent: { include: { course: true } } } },
            examComponent: { include: { course: true } },
            examAttendance: { include: { sitting: true } },
            sittingAssignments: {
              where: { status: { in: ['ASSIGNED', 'CONFIRMED', 'ATTENDED', 'ABSENT', 'EXCUSED'] } },
              include: { sitting: true },
              orderBy: { assignedAt: 'desc' },
            },
            course: true,
            event: true,
          },
          orderBy: { examDate: 'desc' },
        }),
        prisma.examResult.findMany({
          where: { userId: session.user.id },
          include: {
            exam: { include: { examComponent: { include: { course: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.examAttendance.findMany({
          where: { userId: session.user.id },
          include: {
            booking: true,
            sitting: true,
            examComponent: { include: { course: true } },
          },
          orderBy: { attendanceDate: 'desc' },
        }),
        prisma.studentProfile.findUnique({
          where: { userId: session.user.id },
          include: { pathwayRel: true },
        }),
      ])
    } catch (error) {
      console.error(
        'Exams page data fetch error:',
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw new Error('Failed to load exam data. Please try again.')
    }
  }

  // Formal and migrated historical records logic, only computed if Records tab is active
  let allHistory: UnifiedExamRecord[] = []
  let completedAttempts: UnifiedExamRecord[] = []
  let failedAttempts: UnifiedExamRecord[] = []

  if (tab === 'records' && results && bookings && examAttendances) {
    const records: UnifiedExamRecord[] = []
    const seenModuleAttempts = new Set<string>()
    const seenAttendanceIds = new Set<string>()

    // 1. Process formal results first
    results.forEach((r) => {
      const moduleCode = r.moduleCode || r.exam?.examComponent?.course?.code || '—'
      const attemptKey = `${moduleCode}_${r.attemptType || 'FIRST'}`

      records.push({
        id: r.id,
        type: r.migrationRef || r.sourceNotes?.includes('migrated') ? 'HISTORICAL' : 'ORIGINAL',
        moduleCode,
        moduleName: r.exam?.examComponent?.course?.name || r.exam?.name || 'Manual Result',
        date: r.exam?.examDate || r.createdAt,
        dateDisplayKind: 'DATE',
        attendanceStatus: null,
        passed: r.passed,
        score: r.score ? Number(r.score) : null,
        maxScore: r.maxScore ? Number(r.maxScore) : null,
        percentage: r.percentage ? Number(r.percentage) : null,
        grade: r.grade,
        attemptType: r.attemptType,
        result: r.passed ? 'PASS' : 'FAIL',
      })
      seenModuleAttempts.add(attemptKey)
    })

    // 2. Process bookings that don't have a formal result yet
    bookings.forEach((b) => {
      const moduleCode =
        b.moduleCode || b.course?.code || b.exam?.examComponent?.course?.code || '—'
      const attemptKey = `${moduleCode}_${b.attemptType || 'FIRST'}`
      const activeAssignment = b.sittingAssignments?.[0] || null
      const attendanceStatus =
        b.examAttendance?.status || activeAssignment?.attendanceStatus || null
      const effectiveExamDate =
        activeAssignment?.sitting?.startTime ||
        b.examAttendance?.sitting?.startTime ||
        b.examDate ||
        null
      const dateDisplayKind = effectiveExamDate
        ? 'DATE'
        : b.eventId || ['POOLED', 'SCHEDULED', 'POSTPONED'].includes(b.demandStatus)
          ? 'TBC'
          : 'TBD'
      const displayResult = deriveBookingDisplayResult({
        result: b.result,
        demandStatus: b.demandStatus,
        executedAt: b.executedAt,
        rolloverToEventId: b.rolloverToEventId,
        status: b.status,
      })

      // Skip if we already have a formal result for this attempt
      if (seenModuleAttempts.has(attemptKey)) return
      if (b.examAttendance?.id) seenAttendanceIds.add(b.examAttendance.id)

      records.push({
        id: b.id,
        type: b.bookingType === 'MANUAL' ? 'MANUAL' : 'BOOKING',
        moduleCode,
        moduleName:
          b.course?.name || b.exam?.name || b.exam?.examComponent?.course?.name || 'Exam Booking',
        date: effectiveExamDate || b.bookedAt,
        dateDisplayKind,
        dateDisplay: effectiveExamDate ? null : dateDisplayKind,
        sittingLabel: activeAssignment?.sitting
          ? `Day ${activeAssignment.sitting.dayNumber} ${activeAssignment.sitting.sessionType}`
          : null,
        attendanceStatus,
        passed:
          b.result?.toLowerCase() === 'pass'
            ? true
            : b.result?.toLowerCase() === 'fail'
              ? false
              : null,
        score: b.score ? Number(b.score) : null,
        percentage: b.percentage ? Number(b.percentage) : null,
        attemptType: b.attemptType,
        result: formatBookingDisplayResult(displayResult),
      })
    })

    examAttendances.forEach((attendance) => {
      if (seenAttendanceIds.has(attendance.id)) return

      records.push({
        id: `attendance_${attendance.id}`,
        type: 'ATTENDANCE',
        moduleCode:
          attendance.booking?.moduleCode ||
          attendance.examComponent?.course?.code ||
          attendance.examComponent?.code ||
          '—',
        moduleName:
          attendance.examComponent?.course?.name ||
          attendance.booking?.moduleCode ||
          'Exam Attendance',
        date: attendance.sitting?.startTime || attendance.attendanceDate,
        dateDisplayKind: 'DATE',
        sittingLabel: attendance.sitting
          ? `Day ${attendance.sitting.dayNumber} ${attendance.sitting.sessionType}`
          : null,
        attendanceStatus: attendance.status,
        passed: null,
        score: null,
        percentage: null,
        result: attendance.status,
      })
    })

    allHistory = records.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })
    completedAttempts = allHistory.filter((r) => r.passed === true || r.passed === false)
    failedAttempts = allHistory.filter((r) => r.passed === false)
  }

  // Modular (flexible) and Exam-Only students can book their own exams.
  // Full-time students have their exams managed by the academy staff.
  const canBook = isExamOnly || isModular
  const isFullTimeStudent = isFullTime

  const validTabs = isFullTimeStudent
    ? ['records']
    : canBook
      ? ['book', 'resit', 'bookings', 'records']
      : ['bookings', 'records']

  const effectiveTab = validTabs.includes(tab) ? tab : 'records'

  return (
    <ExamsTabs isFullTime={isFullTimeStudent} canBookExams={canBook}>
      {effectiveTab === 'book' && <BookExamTab />}

      {effectiveTab === 'resit' && <ResitBookingTab />}

      {effectiveTab === 'bookings' && <MyBookingsTab />}

      {effectiveTab === 'records' && (
        <div className="space-y-8">
          {/* Pathway Progress (License Progress) */}
          <div className="rounded-3xl border border-slate-100 bg-linear-to-br from-white to-blue-50/20 p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-blue-800 dark:text-white">
                  {studentProfile?.pathwayRel?.name || 'General Pathway'} Progress
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Track your progress towards licensing requirements across all modules.
                </p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-blue-800 text-white sm:flex">
                <ClipboardCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Resulted Attempts</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                  {completedAttempts.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Passed</p>
                <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {completedAttempts.filter((h) => h.passed).length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Failed</p>
                <p className="mt-1 text-2xl font-black text-red-600 dark:text-red-400">
                  {failedAttempts.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Success Rate</p>
                <p className="mt-1 text-2xl font-black text-blue-800 dark:text-blue-400">
                  {completedAttempts.length > 0
                    ? Math.round(
                        (completedAttempts.filter((h) => h.passed).length /
                          completedAttempts.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Unified History List (Formal + Migrated) */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 px-1 text-lg font-black text-slate-900 dark:text-white">
              <HistoryIcon className="h-5 w-5 text-slate-400" />
              Detailed Record
            </h3>
            {allHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-900">
                  <FileBarChart2 className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No records found
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  Graded exam results will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <span>
                    <strong>TBC</strong>: final sitting/date is still to be confirmed.
                  </span>
                  <span>
                    <strong>TBD</strong>: no exam date has been set yet.
                  </span>
                </div>
                <ExamHistoryTable results={allHistory} />
              </>
            )}
          </div>

          {/* Failed Attempts Logic (Call to action) */}
          {failedAttempts.length > 0 && (
            <div className="rounded-2xl border border-red-100 bg-red-50/30 p-6 dark:border-red-900/30 dark:bg-red-900/10">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-400">
                    Modules Pending Resit
                  </h4>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400/80">
                    You have {failedAttempts.length} module{failedAttempts.length > 1 ? 's' : ''}{' '}
                    that need to be cleared.
                  </p>
                  {canBook && (
                    <div className="mt-4">
                      <Link
                        href="/student/exams?tab=resit"
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700 active:scale-95"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Book Resit Now
                      </Link>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.from(new Set(failedAttempts.map((f) => f.moduleCode))).map((code) => (
                      <span
                        key={code}
                        className="inline-flex rounded-lg bg-red-100 px-3 py-1 text-xs font-black text-red-700"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ExamsTabs>
  )
}
