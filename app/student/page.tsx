import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BookOpen,
  Calendar,
  Wallet,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Package,
  AlertCircle,
  GraduationCap,
  History as HistoryIcon,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import WelcomeBanner from '@/components/WelcomeBanner'
import { canAccessFeature, getEnrollmentMilestoneStatus, getStudentStatus } from '@/lib/access-control'
import { getWelcomeMessages } from '@/lib/welcome-messages'

import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'

export const metadata: Metadata = {
  title: 'Dashboard | Student Portal',
  description: 'Your student dashboard with courses, exams, and wallet overview.',
}

export default async function StudentDashboard() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  // 1. Fetch Profile & Shared Data
  const [profile, wallet, welcomeMessages, userRecord] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        pathwayRel: true,
        licenseTargets: {
          include: { licenseCategory: true },
        },
        academicYear: true,
        semester: true,
      },
    }),
    prisma.wallet.findUnique({ where: { userId } }),
    getWelcomeMessages(prisma, session.user.role),
    prisma.user.findUnique({ where: { id: userId }, select: { mustChangePassword: true } }),
  ])

  if (userRecord?.mustChangePassword) {
    redirect('/student/profile/change-password')
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]" role="alert">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Profile Not Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your student profile has not been set up yet. Please contact the administration office for assistance.</p>
        </div>
      </div>
    )
  }

  const { isFullTime, isExamOnly, isModular: isFlexible, enrollmentType, pathwayCode } = await getStudentStatus(userId)
  const activePathway = profile.pathwayRel

  // 2b. Parallel data fetching — all independent queries run concurrently
  const [
    upcomingExams,
    ftEnrollmentRaw,
    flexEnrollments,
    genericEnrollments,
    ftCourseEnrollmentCount,
    currentPoolsCount,
    poolMemberships,
    latestResultRecord,
    latestMigratedRecord,
  ] = await Promise.all([
    // Common: Upcoming exams
    prisma.examBooking.findMany({
      where: {
        userId,
        status: { in: ['APPROVED', 'PENDING'] },
        examDate: { gte: new Date() },
      },
      include: { exam: { include: { examComponent: { include: { course: true } } } }, event: true },
      orderBy: { examDate: 'asc' },
      take: 3,
    }),
    // Full-Time enrollment
    isFullTime
      ? prisma.fullTimeEnrollment.findFirst({
          where: { studentId: userId },
          include: { programme: true },
        })
      : Promise.resolve(null),
    // Flexible (Modular) course enrollments
    isFlexible
      ? prisma.enrollment.findMany({
          where: { userId, status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED'] } },
          include: { course: true },
          take: 3,
        })
      : Promise.resolve([]),
    // General course enrollments (non-full-time)
    !isFullTime && !isExamOnly
      ? prisma.enrollment.findMany({
          where: { userId, status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED'] } },
          include: { course: true },
          take: 3,
        })
      : Promise.resolve([]),
    // Full-time course enrollment count
    isFullTime
      ? prisma.enrollment.count({
          where: { userId, status: { in: ['ACTIVE', 'APPROVED'] } },
        })
      : Promise.resolve(0),
    // Pool memberships count
    prisma.poolMembership.count({
      where: { userId, status: { in: ['RESERVED', 'CONFIRMED'] } },
    }),
    // Pool memberships list
    prisma.poolMembership.findMany({
      where: { 
        userId, 
        status: { in: ['RESERVED', 'CONFIRMED'] },
        pool: { isAutoPool: false } // Only show standard/group pools on dashboard
      },
      include: { pool: true },
      take: 3,
    }),
    // Latest exam result
    prisma.examResult.findFirst({
      where: { userId },
      include: { exam: { include: { examComponent: { include: { course: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    // Latest migrated booking result
    prisma.examBooking.findFirst({
      where: { userId, result: { in: ['pass', 'fail'] } },
      orderBy: { examDate: 'desc' },
    }),
  ])

  // Full-Time: fetch milestones if enrollment exists (depends on ftEnrollment)
  const ftEnrollment = ftEnrollmentRaw
  let ftMilestones: any[] = []
  if (ftEnrollment) {
    ftMilestones = await prisma.paymentMilestone.findMany({
      where: { enrollmentId: ftEnrollment.id, status: { in: ['DUE', 'OVERDUE'] } },
      orderBy: { dueDate: 'asc' },
      take: 2,
    })
  }

  const dashboardResult = latestResultRecord
    ? {
        module: latestResultRecord.exam.examComponent?.course?.code || '—',
        passed: latestResultRecord.passed,
        status: `${Number(latestResultRecord.percentage)}%`,
      }
    : latestMigratedRecord
      ? {
          module: latestMigratedRecord.moduleCode || '—',
          passed: latestMigratedRecord.result === 'pass',
          status: latestMigratedRecord.result?.toUpperCase() || '—',
        }
      : null

  const renderActiveAcademicBlock = () => {
    if (isExamOnly) {
      return (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-linear-to-br from-white to-blue-50/30 p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-aerojet-blue dark:text-white">
                    Exam Only Pathway
                  </h2>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">Manage your exam bookings and view results.</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-aerojet-blue text-white dark:bg-blue-600">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    {currentPoolsCount} Exam Booking{currentPoolsCount !== 1 ? 's' : ''} Joined
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    You are currently part of {currentPoolsCount} active exam bookings.
                  </p>
                </div>
                <Link
                  href="/student/exams"
                  className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-100 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400">
                    <HistoryIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    View Exam History &rarr;
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    See your results, passes, and licensing progress.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (isFullTime) {
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Full-Time Programme</h2>
            <Link
              href="/student/courses"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Details
            </Link>
          </div>
          <div className="p-4 sm:p-6">
            {ftEnrollment ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 sm:gap-4 sm:p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-black tracking-widest text-white uppercase">
                        ID: {ftEnrollment.programme.code}
                      </span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {ftEnrollment.academicYear || ''}
                      </span>
                    </div>
                    <h3 className="text-sm leading-tight font-bold text-slate-900 dark:text-slate-100">
                      {ftEnrollment.programme.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium tracking-tighter text-slate-500 uppercase">
                      Year {ftEnrollment.currentYearNumber} •{' '}
                      {ftEnrollment.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                {ftMilestones.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                      Upcoming Milestones
                    </p>
                    {ftMilestones.map((m) => (
                      <div
                        key={m.id}
                        className="mb-2 flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {m.milestoneType.replace('_', ' ')}
                        </span>
                        <CurrencyDisplay
                          amount={Number(m.amountDue)}
                          baseCurrency={wallet?.currency || 'EUR'}
                          clickToToggle={true}
                          size="sm"
                          amountClassName="text-amber-600 dark:text-amber-400"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                {ftCourseEnrollmentCount === 0 ? (
                  <>
                    <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                      Courses Not Activated Yet
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your courses for this semester have not been activated by the academy. Please
                      contact the administration office.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {ftCourseEnrollmentCount} Course{ftCourseEnrollmentCount !== 1 ? 's' : ''}{' '}
                      Active
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      View your enrolled courses for details.
                    </p>
                    <Link
                      href="/student/courses"
                      className="mt-3 inline-block text-sm font-bold text-blue-600 hover:underline"
                    >
                      View Courses →
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (isFlexible && !isExamOnly) {
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Flexible Courses</h2>
            <Link
              href="/student/courses"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="p-4 sm:p-6">
            {flexEnrollments.length > 0 ? (
              <div className="space-y-4">
                {flexEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                          {enrollment.course.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {enrollment.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="mb-4 text-sm text-slate-500">You have no active Flexible Courses.</p>
                <Link
                  href="/student/courses/enroll"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  Browse Catalog →
                </Link>
              </div>
            )}

            {/* Show standalone courses if any */}
            {genericEnrollments.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <p className="mb-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Standalone Courses
                </p>
                <div className="space-y-3">
                  {genericEnrollments.map((gen) => (
                    <div key={gen.id} className="flex w-full items-center justify-between">
                      <span className="text-sm font-semibold">{gen.course.name}</span>
                      <span className="text-xs text-slate-500">{gen.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  // Attendance block or Result Highlight
  const attendanceBlock = isExamOnly ? (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${dashboardResult?.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
        >
          {dashboardResult?.passed ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <AlertCircle className="h-6 w-6" />
          )}
        </div>
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Latest Result
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100">
            {dashboardResult
              ? `${dashboardResult.module}: ${dashboardResult.status}`
              : 'No results yet'}
          </p>
        </div>
      </div>
    </div>
  ) : (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Attendance</p>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100">Not Tracked Yet</p>
        </div>
      </div>
    </div>
  )

  // 3. Labels & Mapping
  const PATHWAY_LABELS: Record<string, string> = {
    B1_MECHANICAL: 'B1',
    B2_AVIONICS: 'B2',
    B1_B2_DUAL: 'B1 & B2',
  }

  const LICENSE_LABELS: Record<string, string> = {
    B1_1_AEROPLANES_TURBINE: 'B1.1 Aeroplanes Turbine',
    B1_2_AEROPLANES_PISTON: 'B1.2 Aeroplanes Piston',
    B1_3_HELICOPTERS_TURBINE: 'B1.3 Helicopters Turbine',
    B1_4_HELICOPTERS_PISTON: 'B1.4 Helicopters Piston',
    B2_AVIONICS: 'B2 Avionics',
    B3_PISTON_AEROPLANE: 'B3 Piston Aeroplane',
  }

  const licenseList = profile.licenseTargets.map((t) => t.licenseCategory.code).join(' & ')

  return (
    <div className="space-y-8">
      <WelcomeBanner messages={welcomeMessages} userName={session.user.name?.split(' ')[0]} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap gap-2">
          {profile.pathwayRel && (
            <span className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black tracking-widest text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
              PATHWAY: {profile.pathwayRel.name}
            </span>
          )}
          {licenseList && (
            <span className="inline-flex items-center justify-center rounded-xl bg-blue-100 px-4 py-2.5 text-xs font-black tracking-widest text-blue-700 uppercase dark:bg-blue-900/40 dark:text-blue-300">
              LICENSE: {licenseList}
            </span>
          )}
          {!profile.pathwayRel && (
            <span className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black tracking-widest text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
              TYPE: {(enrollmentType ?? '').replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <Link
          href="/student/wallet/top-up"
          className="bg-aerojet-blue inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
        >
          <Wallet className="h-4 w-4" />
          Top Up Wallet
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Available Balance
              </p>
              <CurrencyDisplay
                amount={Number(wallet?.availableBalance || 0)}
                baseCurrency={wallet?.currency || 'EUR'}
                clickToToggle={true}
                size="lg"
                amountClassName="text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Upcoming Exams
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                {upcomingExams.length}
              </p>
            </div>
          </div>
        </div>

        {attendanceBlock}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-8 lg:col-span-2">
          {renderActiveAcademicBlock()}

          {/* Upcoming Exams */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">
                Upcoming Individual Bookings
              </h2>
              <Link
                href="/student/exams"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View Schedule
              </Link>
            </div>
            <div className="p-4 sm:p-6">
              {upcomingExams.length > 0 ? (
                <div className="space-y-4">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 sm:gap-4 sm:p-4 dark:border-slate-800"
                    >
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:text-slate-400">
                        <span className="text-xs font-bold uppercase">
                          {exam.examDate?.toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black">{exam.examDate?.getDate()}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                          {exam.exam?.examComponent?.course?.name || 'Exam Session'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {exam.exam?.duration || 0} minutes • {exam.event?.location || 'Main Hall'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  No upcoming individual exams scheduled.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2>
            </div>
            <div className="space-y-2 p-3 sm:p-4">
              {!isFullTime && !isExamOnly && (
                <Link
                  href="/student/courses/enroll"
                  className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Enroll in Course
                  </span>
                </Link>
              )}
              {!isFullTime && (
                <Link
                  href="/student/exam-bookings"
                  className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Join Exam Booking
                  </span>
                </Link>
              )}
              <Link
                href="/student/certificates"
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Download Certificates
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
