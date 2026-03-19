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
import ExamsTabs from './_components/ExamsTabs'
import ExamHistoryTable from './_components/ExamHistoryTable'
import { canAccessFeature, getEnrollmentMilestoneStatus, getStudentStatus } from '@/lib/access-control'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'

// The newly extracted tabs
import AvailablePoolsTab from './_components/AvailablePoolsTab'
import MyBookingsTab from './_components/MyBookingsTab'
import BookingActionTab from './_components/BookingActionTab'
import ResitBookingTab from './_components/ResitBookingTab'

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
  const tab = tabParam || 'available'

  const session = await getAuthSession()

  const { isFullTime, isExamOnly, isModular } = await getStudentStatus(session.user.id)
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

        <PaymentRequiredBanner
          accessLevel="SEAT_ONLY"
          milestoneStatus={milestoneStatus}
          walletBalance={walletBalance}
        />
      </div>
    )
  }

  // Common data for Records tab
  let bookings, results, studentProfile
  if (tab === 'records') {
    try {
      ;[bookings, results, studentProfile] = await Promise.all([
        prisma.examBooking.findMany({
          where: { userId: session.user.id },
          include: {
            exam: { include: { examComponent: { include: { course: true } } } },
            examComponent: { include: { course: true } },
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
    } catch (error) {
      console.error(
        'Exams page data fetch error:',
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw new Error('Failed to load exam data. Please try again.')
    }
  }

  // Formal and migrated historical records logic, only computed if Records tab is active
  let allHistory: any[] = []
  let failedAttempts: any[] = []
  
  if (tab === 'records' && results && bookings) {
    const formalResults = results.map((r) => ({
      id: r.id,
      type: 'ORIGINAL',
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
      .filter((b: any) => {
        const r = b.result?.toLowerCase()
        return r === 'pass' || r === 'fail' || (b.score !== null && b.score !== undefined)
      })
      .filter((b: any) => {
        // Deduplicate: if there is a formal result for the same module on the same date, skip the booking
        const bCode = b.moduleCode || b.exam?.examComponent?.course?.code
        const bDate = (b.examDate || b.bookedAt).getTime()
        return !formalResults.some((f) => f.moduleCode === bCode && f.date.getTime() === bDate)
      })
      .map((b: any) => {
        const score = b.score !== null && b.score !== undefined ? Number(b.score) : undefined
        const resultStr = b.result?.toLowerCase()
        
        let passed: boolean | null = null
        if (score !== undefined) {
          passed = score >= 75
        } else if (resultStr === 'pass') {
          passed = true
        } else if (resultStr === 'fail') {
          passed = false
        }

        return {
          id: b.id,
          type: 'HISTORICAL',
          moduleCode: b.moduleCode || b.exam?.examComponent?.course?.code || b.examComponent?.course?.code || '—',
          moduleName: b.examComponent?.course?.name || b.exam?.examComponent?.course?.name || 'Historical Exam',
          date: b.examDate || b.bookedAt,
          passed,
          score,
          percentage: score,
          grade: b.result?.toUpperCase(),
          attemptType: b.attemptType,
        }
      })

    allHistory = [...formalResults, ...historicalResults]
    failedAttempts = allHistory.filter((r) => r.passed === false)
  }

  // For full-time students, redirect to records tab if trying to access booking tabs
  const isFullTimeStudent = isFullTime
  const validTabs = isFullTimeStudent ? ['records', 'bookings'] : ['available', 'individual', 'group', 'resit', 'bookings', 'records']
  const effectiveTab = validTabs.includes(tab) ? tab : (isFullTimeStudent ? 'records' : 'available')

  return (
    <ExamsTabs isFullTime={isFullTimeStudent}>
      {effectiveTab === 'available' && <AvailablePoolsTab />}

      {effectiveTab === 'individual' && <BookingActionTab type="individual" />}

      {effectiveTab === 'group' && <BookingActionTab type="group" />}

      {effectiveTab === 'resit' && <ResitBookingTab />}

      {effectiveTab === 'bookings' && <MyBookingsTab />}

      {effectiveTab === 'records' && (
        <div className="space-y-8">
          {/* Pathway Progress (License Progress) */}
          <div className="rounded-3xl border border-slate-100 bg-linear-to-br from-white to-blue-50/20 p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#002a5c] dark:text-white">
                  {studentProfile?.pathwayRel?.name || 'General Pathway'} Progress
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
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
                <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {allHistory.filter((h) => h.passed).length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Failed</p>
                <p className="mt-1 text-2xl font-black text-red-600 dark:text-red-400">{failedAttempts.length}</p>
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
              <ExamHistoryTable results={allHistory} />
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
                    that need to be cleared. Visit the "Resit" tab to schedule a resit session.
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
