import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BookOpen,
  Calendar,
  Wallet,
  TrendingUp,
  Clock,
  ArrowRight,
  Bell,
  CheckCircle2,
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

  // Fetch all necessary data in parallel
  const [
    wallet,
    enrollments,
    upcomingExams,
    unreadNotifications,
    attendanceStats,
    welcomeMessages,
  ] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { course: true },
      take: 3,
    }),
    prisma.examBooking.findMany({
      where: {
        userId,
        status: { in: ['APPROVED', 'PENDING'] },
        examDate: { gte: new Date() },
      },
      include: { exam: { include: { course: true } }, event: true },
      orderBy: { examDate: 'asc' },
      take: 3,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.attendanceRecord.findMany({
      where: { userId },
      select: { status: true },
    }),
    getWelcomeMessages(prisma),
  ])

  // Calculate Attendance Rate
  const totalAttendance = attendanceStats.length
  const presentOrLate = attendanceStats.filter(
    (r) => r.status === 'PRESENT' || r.status === 'LATE'
  ).length
  const attendanceRate =
    totalAttendance > 0 ? Math.round((presentOrLate / totalAttendance) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Welcome Banner (replaces static greeting) */}
      <WelcomeBanner messages={welcomeMessages} userName={session.user.name?.split(' ')[0]} />

      {/* Quick Actions */}
      <div className="flex justify-end">
        <Link
          href="/student/wallet/top-up"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#002a5c] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#003a7c] active:scale-95"
        >
          <Wallet className="h-4 w-4" />
          Top Up Wallet
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Balance</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                {wallet?.currency || 'GH₵'} {Number(wallet?.availableBalance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Active Courses
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">{enrollments.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Upcoming Exams
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">{upcomingExams.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Attendance
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">{attendanceRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Active Courses */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Active Courses</h2>
              <Link
                href="/student/courses"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="p-6">
              {enrollments.length > 0 ? (
                <div className="space-y-4">
                  {enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-4 transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">{enrollment.course.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{enrollment.course.code}</p>
                        </div>
                      </div>
                      <Link
                        href={`/student/courses/${enrollment.id}`}
                        className="rounded-lg bg-slate-100 p-2 text-slate-400 transition-colors hover:bg-white dark:bg-slate-900 hover:text-blue-600 hover:shadow-sm"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    You are not enrolled in any active courses.
                  </p>
                  <Link
                    href="/student/courses/enroll"
                    className="mt-4 inline-block text-sm font-bold text-blue-600 hover:underline"
                  >
                    Browse Courses →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Upcoming Exams</h2>
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
                      className="flex items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-800 p-4"
                    >
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:text-slate-400">
                        <span className="text-[10px] font-bold uppercase">
                          {exam.examDate?.toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black">{exam.examDate?.getDate()}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{exam.exam.course.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {exam.exam.duration} minutes • {exam.event?.location || 'Main Hall'}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        {exam.examDate?.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                  No upcoming exams scheduled.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Notifications */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-900 text-white shadow-sm">
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
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2>
            </div>
            <div className="space-y-2 p-4">
              <Link
                href="/student/courses/enroll"
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">Enroll in Course</span>
              </Link>
              <Link
                href="/student/exam-pools"
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">Book Exam Seat</span>
              </Link>
              <Link
                href="/student/certificates"
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">Download Certificates</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
