import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BookOpen,
  Calendar,
  Wallet,
  TrendingUp,
  ArrowRight,
  Bell,
  CheckCircle2,
  Package,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import WelcomeBanner from '@/components/WelcomeBanner'
import { getWelcomeMessages } from '@/lib/welcome-messages'

export const metadata: Metadata = { title: 'Dashboard | Student Portal' }

export default async function StudentDashboard() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  // 1. Fetch Profile & Shared Data
  const [profile, wallet, unreadNotifications, welcomeMessages] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    getWelcomeMessages(prisma, session.user.role),
  ])

  if (!profile || !profile.studyPathway) {
    // Should be caught by middleware/requirePathway, but fallback
    redirect('/applicant/pathway')
  }

  const pathway = profile.studyPathway

  // 2. Conditional Data Fetching based on Pathway
  const isFullTime = pathway === 'FULL_TIME'
  const isModular = pathway === 'MODULAR'
  const isExamOnly = pathway === 'EXAM_ONLY'

  // Common: Exams
  const upcomingExams = await prisma.examBooking.findMany({
    where: {
      userId,
      status: { in: ['APPROVED', 'PENDING'] },
      examDate: { gte: new Date() },
    },
    include: { exam: { include: { course: true } }, event: true },
    orderBy: { examDate: 'asc' },
    take: 3,
  })

  // Full-Time Data
  let ftEnrollment = null
  let ftMilestones = []
  if (isFullTime) {
    ftEnrollment = await prisma.fullTimeEnrollment.findFirst({
      where: { studentId: userId },
      include: { programme: true },
    })
    if (ftEnrollment) {
      ftMilestones = await prisma.paymentMilestone.findMany({
        where: { enrollmentId: ftEnrollment.id, status: { in: ['DUE', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' },
        take: 2,
      })
    }
  }

  // Modular Data
  let modEnrollments = []
  if (isModular) {
    modEnrollments = await prisma.modularEnrollment.findMany({
      where: { studentId: userId, status: { in: ['ACTIVE', 'CONFIRMED'] } },
      include: { package: true },
      take: 3,
    })
  }

  // General Courses (if they took any standalone)
  const genericEnrollments = await prisma.enrollment.findMany({
    where: { userId, status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED'] } },
    include: { course: true },
    take: isExamOnly ? 0 : 3, // Exam only shouldn't really have courses, but just in case
  })

  // Exam Pools Joined
  const poolMemberships = await prisma.poolMembership.findMany({
    where: { userId, status: { in: ['RESERVED', 'CONFIRMED'] } },
    include: { pool: true },
    take: 3,
  })

  const renderActiveAcademicBlock = () => {
    if (isFullTime) {
      return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Full-Time Programme</h2>
            <Link
              href="/student/courses"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Details
            </Link>
          </div>
          <div className="p-6">
            {ftEnrollment ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">
                      {ftEnrollment.programme.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Year {ftEnrollment.currentYearNumber} •{' '}
                      {ftEnrollment.status.replace('_', ' ')}
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
                        <span className="font-black text-amber-600">
                          €{Number(m.amountDue).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="mb-4 text-sm text-slate-500">
                  You have not enrolled in a Full-Time Programme yet.
                </p>
                <Link
                  href="/student/courses/enroll"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  Browse Programmes →
                </Link>
              </div>
            )}
          </div>
        </div>
      )
    }

    if (isModular) {
      return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Modular Packages</h2>
            <Link
              href="/student/courses"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            {modEnrollments.length > 0 ? (
              <div className="space-y-4">
                {modEnrollments.map((enrollment) => (
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
                          {enrollment.package.name}
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
                <p className="mb-4 text-sm text-slate-500">You have no active Modular Packages.</p>
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

    if (isExamOnly) {
      return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Exam Pools Joined</h2>
            <Link
              href="/student/exam-pools/my-bookings"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            {poolMemberships.length > 0 ? (
              <div className="space-y-4">
                {poolMemberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                          {membership.pool.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Status: {membership.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="mb-4 text-sm text-slate-500">You have not joined any Exam Pools.</p>
                <Link
                  href="/student/exam-pools"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  Find Exam Pools →
                </Link>
              </div>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  // Attendance block can be hidden for EXAM_ONLY
  const attendanceBlock = !isExamOnly && (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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

  const { GraduationCap } = await import('lucide-react')

  return (
    <div className="space-y-8">
      <WelcomeBanner messages={welcomeMessages} userName={session.user.name?.split(' ')[0]} />

      <div className="flex justify-end">
        <div className="flex gap-3">
          <span className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black tracking-widest text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
            PATHWAY: {pathway.replace('_', ' ')}
          </span>
          <Link
            href="/student/wallet/top-up"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#002a5c] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#003a7c] active:scale-95"
          >
            <Wallet className="h-4 w-4" />
            Top Up Wallet
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Available Balance
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {wallet?.currency || 'EUR'} {Number(wallet?.availableBalance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-8 lg:col-span-2">
          {renderActiveAcademicBlock()}

          {/* Upcoming Exams */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
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
            <div className="p-6">
              {upcomingExams.length > 0 ? (
                <div className="space-y-4">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                    >
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:text-slate-400">
                        <span className="text-[10px] font-bold uppercase">
                          {exam.examDate?.toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black">{exam.examDate?.getDate()}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                          {exam.exam?.course?.name || 'Exam Session'}
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
          {/* Notifications */}
          <div className="rounded-2xl border border-slate-100 bg-slate-900 text-white shadow-sm dark:border-slate-800">
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="flex items-center gap-2 font-bold">
                <Bell className="h-4 w-4 text-blue-400" />
                Notifications
              </h2>
            </div>
            <div className="p-6 text-center">
              <div className="mb-2 text-3xl font-black tracking-tight">{unreadNotifications}</div>
              <p className="text-xs text-slate-400">Unread messages</p>
              <Link
                href="/student/notifications"
                className="mt-6 block w-full rounded-xl bg-blue-600 py-3 text-sm font-bold transition-colors hover:bg-blue-500"
              >
                View Notifications
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2>
            </div>
            <div className="space-y-2 p-4">
              {!isExamOnly && (
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
              <Link
                href="/student/exam-pools"
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Join Exam Pool
                </span>
              </Link>
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
