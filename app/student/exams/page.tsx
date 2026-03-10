import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  ClipboardCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  FileBarChart2,
  History as HistoryIcon,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import ResitBookingButton from './_components/ResitBookingButton'
import Link from 'next/link'
import ExamsTabs from './_components/ExamsTabs'
import ExamHistoryTable from './_components/ExamHistoryTable'
import StudentBookingsTable from './_components/StudentBookingsTable'
import { format } from 'date-fns'
import { canAccessFeature, getEnrollmentMilestoneStatus } from '@/lib/access-control'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'

export const metadata: Metadata = {
  title: 'My Exams | Student Portal',
  description: 'View your exam bookings, results, and history.',
}
export const dynamic = 'force-dynamic'

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const tab = tabParam || 'bookings'

  const session = await getAuthSession()

  const initialProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { enrollmentType: true },
  })

  const isFullTime = initialProfile?.enrollmentType === 'FULL_TIME'
  const hasAccess = await canAccessFeature(session.user.id, 'exams')

  if (isFullTime && !hasAccess) {
    const [milestoneStatus, wallet] = await Promise.all([
      getEnrollmentMilestoneStatus(session.user.id),
      prisma.wallet.findUnique({
        where: { userId: session.user.id },
        select: { availableBalance: true, reservedBalance: true, currency: true },
      }),
    ])

    const walletBalance = {
      available: Number(wallet?.availableBalance ?? 0),
      held: Number(wallet?.reservedBalance ?? 0),
      currency: wallet?.currency ?? 'EUR',
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#002a5c] sm:text-3xl dark:text-white">
            My Exams
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View and manage your exam bookings and results.
          </p>
        </div>

        <PaymentRequiredBanner
          accessLevel="SEAT_ONLY"
          milestoneStatus={milestoneStatus}
          walletBalance={walletBalance}
        />
      </div>
    )
  }

  const [bookings, results, studentProfile] = await Promise.all([
    prisma.examBooking.findMany({
      where: { userId: session.user.id },
      include: {
        exam: { include: { examComponent: { include: { course: true } } } },
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
    prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: { pathwayRel: true },
    }),
  ])

  // Map raw bookings to BookingRecord interface for child components
  const mappedBookings = bookings.map((b: any) => ({
    id: b.id,
    moduleCode: b.moduleCode || b.exam?.examComponent?.code || '—',
    moduleName: b.exam?.examComponent?.course?.name || 'Exam Module',
    date: b.examDate || b.bookedAt,
    status: b.status,
    amountPaid: Number(b.amountPaid),
    bookingType: b.bookingType.replace(/_/g, ' '),
  }))

  const upcomingExams = mappedBookings.filter(
    (b) => (b.status === 'APPROVED' || b.status === 'PENDING') && b.date && b.date >= new Date()
  )
  const pendingExams = mappedBookings.filter((b) => b.status === 'PENDING')

  // Unify results and historical passes/fails
  const formalResults = results.map((r) => ({
    id: r.id,
    type: 'RESULT',
    moduleCode: r.exam.examComponent?.course?.code || '—',
    moduleName: r.exam.examComponent?.course?.name || r.exam.name,
    date: r.exam.examDate,
    passed: r.passed,
    score: Number(r.score),
    maxScore: Number(r.maxScore),
    percentage: Number(r.percentage),
    grade: r.grade,
  }))

  const historicalResults = bookings
    .filter((b: any) => b.result === 'pass' || b.result === 'fail' || b.score !== null)
    .filter((b: any) => {
      // Deduplicate: if there is a formal result for the same module on the same date, skip the booking
      const bCode = b.moduleCode || b.exam?.examComponent?.course?.code
      const bDate = (b.examDate || b.bookedAt).getTime()
      return !formalResults.some((f) => f.moduleCode === bCode && f.date.getTime() === bDate)
    })
    .map((b: any) => {
      const score = b.score ? Number(b.score) : undefined
      // User requested: "for now the pass should still show until admin add the exam score"
      // Also: "make sure that unwritten/completed/unpaid for exams ... do not show as failed"
      const passed = score !== undefined ? score >= 75 : b.result !== 'fail'

      return {
        id: b.id,
        type: 'MIGRATED',
        moduleCode: b.moduleCode || b.exam?.examComponent?.course?.code || '—',
        moduleName: b.exam?.examComponent?.course?.name || 'Historical Exam',
        date: b.examDate || b.bookedAt,
        passed,
        score,
        percentage: score,
        grade: b.result?.toUpperCase(),
        attemptType: b.attemptType,
      }
    })

  const allHistory = [...formalResults, ...historicalResults]
  const failedAttempts = allHistory.filter((r) => !r.passed)

  return (
    <ExamsTabs>
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Upcoming',
            value: upcomingExams.length,
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Pending Payment',
            value: pendingExams.length,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Failed Attempts',
            value: failedAttempts.length,
            icon: AlertCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                  {stat.label}
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bookings Tab ── */}
      {tab === 'bookings' && (
        <div className="space-y-6">
          {upcomingExams.length > 0 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 px-1 text-lg font-black text-slate-900 dark:text-white">
                <Calendar className="h-5 w-5 text-blue-600" />
                Upcoming Exams
              </h3>
              <StudentBookingsTable bookings={upcomingExams} />
            </div>
          )}

          {pendingExams.length > 0 && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 px-1 text-lg font-black text-slate-900 dark:text-white">
                <Clock className="h-5 w-5 text-amber-500" />
                Awaiting Payment / Verification
              </h3>
              <StudentBookingsTable bookings={pendingExams} />
            </div>
          )}

          {/* All Bookings List */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 px-1 text-lg font-black text-slate-900 dark:text-white">
              <HistoryIcon className="h-5 w-5 text-slate-400" />
              Booking History
            </h3>
            <StudentBookingsTable bookings={mappedBookings} />
          </div>
        </div>
      )}

      {/* ── Results Tab ── */}
      {tab === 'results' && (
        <div className="space-y-8">
          {allHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                <FileBarChart2 className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Formal Results Pending
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Your graded results will appear here once published by the examination board.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allHistory
                .filter((r) => r.score !== undefined || r.grade !== undefined) // Only show records with some form of result
                .map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold tracking-wide text-blue-600 uppercase">
                        {result.moduleCode}
                      </div>
                      {result.passed ? (
                        <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Passed
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-black text-red-700 uppercase">
                          <XCircle className="h-3 w-3" /> Failed
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 text-lg leading-tight font-bold text-slate-900 dark:text-slate-100">
                      {result.moduleName}
                    </h3>
                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-50 pt-4 dark:border-slate-800">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Score</p>
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                          {result.score !== undefined ? `${result.score}%` : result.grade || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Type</p>
                        <p className="text-sm font-bold text-slate-500 uppercase">
                          {result.type === 'RESULT' ? 'Formal' : 'Manual'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── History & Pathway Tab ── */}
      {tab === 'history' && (
        <div className="space-y-8">
          {/* Pathway Progress (License Progress) */}
          <div className="rounded-3xl border border-slate-100 bg-linear-to-br from-white to-blue-50/20 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#002a5c] dark:text-white">
                  {studentProfile?.pathwayRel?.name || 'General Pathway'} Progress
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Track your progress towards licensing requirements across all modules.
                </p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#002a5c] text-white sm:flex">
                <ClipboardCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Attempts</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                  {allHistory.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Passed</p>
                <p className="mt-1 text-2xl font-black text-emerald-600">
                  {allHistory.filter((h) => h.passed).length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Failed</p>
                <p className="mt-1 text-2xl font-black text-red-600">{failedAttempts.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Success Rate</p>
                <p className="mt-1 text-2xl font-black text-[#002a5c] dark:text-blue-400">
                  {allHistory.length > 0
                    ? Math.round(
                        (allHistory.filter((h) => h.passed).length / allHistory.length) * 100
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
              <HistoryIcon className="h-5 w-5 text-blue-600" />
              All Historical Records
            </h3>

            <ExamHistoryTable records={allHistory} />
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
                    that need to be cleared. Visit the "Bookings" tab to schedule a resit session.
                  </p>
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
