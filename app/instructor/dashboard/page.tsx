import { Metadata } from 'next'
import Link from 'next/link'
import {
  School,
  Users,
  ClipboardCheck,
  Calendar,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react'
import WelcomeBanner from '@/components/WelcomeBanner'
import { getWelcomeMessages } from '@/lib/welcome-messages'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getInstructorDashboardData } from '@/lib/actions/instructor'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Dashboard | Instructor Portal' }

export default async function Page() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const instructorData = await getInstructorDashboardData()
  const firstName = session.user.name?.split(' ')[0]

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-slate-100" />}>
        <AsyncWelcomeBanner userName={firstName} />
      </Suspense>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Classes */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-blue-500/5 transition-transform group-hover:scale-150" />
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
            <School className="h-6 w-6" />
          </div>
          <div className="relative z-10 mt-5">
            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {instructorData.activeCohortsCount}
            </p>
            <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Active Classes
            </p>
          </div>
        </div>

        {/* Total Students */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 transition-all hover:shadow-xl hover:shadow-emerald-500/10 dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-emerald-500/5 transition-transform group-hover:scale-150" />
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div className="relative z-10 mt-5">
            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {instructorData.totalStudents}
            </p>
            <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Total Students
            </p>
          </div>
        </div>

        {/* Pending Grading */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 transition-all hover:shadow-xl hover:shadow-orange-500/10 dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-orange-500/5 transition-transform group-hover:scale-150" />
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div className="relative z-10 mt-5">
            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {instructorData.pendingGradesCount}
            </p>
            <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Pending Grading
            </p>
          </div>
        </div>

        {/* Classes Today */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 transition-all hover:shadow-xl hover:shadow-purple-500/10 dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-purple-500/5 transition-transform group-hover:scale-150" />
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-lg shadow-purple-500/20">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="relative z-10 mt-5">
            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {instructorData.todaysClasses.length}
            </p>
            <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Classes Today
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Classes */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 border-b border-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-slate-100">
              <Calendar className="h-5 w-5 text-slate-400" /> Today&apos;s Schedule
            </h2>
            <Link
              href="/instructor/schedule"
              className="group flex items-center gap-1.5 text-xs font-black tracking-widest text-aerojet-blue uppercase transition-all hover:translate-x-1"
            >
              Full Schedule <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {instructorData.todaysClasses.length > 0 ? (
              instructorData.todaysClasses.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/instructor/classes/${cls.id}`}
                  className="group flex items-center justify-between px-6 py-5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-aerojet-blue dark:bg-blue-900/20">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-900 transition-colors group-hover:text-aerojet-blue dark:text-slate-100">
                        {cls.course.name}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {new Date(cls.startDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {cls.name}
                      </p>
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500 uppercase dark:bg-slate-800">
                      {cls.currentStudents} students
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                  <Calendar className="h-8 w-8 text-slate-200" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No classes today</h3>
                <p className="mt-1 text-xs text-slate-400">Enjoy your free time or prepare for tomorrow.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Grading */}
        <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-50 px-6 py-5 dark:border-slate-800">
            <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-slate-100">
              <AlertCircle className="h-5 w-5 text-orange-500" /> Action Required
            </h2>
          </div>
          <div className="flex-1 divide-y divide-slate-50 dark:divide-slate-800">
            {instructorData.pendingGradingDetails.length > 0 ? (
              instructorData.pendingGradingDetails.map((item, i) => (
                <div key={i} className="px-6 py-5 transition-colors hover:bg-orange-50/30 dark:hover:bg-orange-950/10">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-black text-aerojet-blue">{item.module}</span>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-black text-orange-700 uppercase">
                      Needs Grade
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.studentName}</p>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    {item.assessmentName} · {new Date(item.date).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20">
                  <ClipboardCheck className="h-7 w-7" />
                </div>
                <p className="text-xs font-bold text-slate-500">All grading complete!</p>
              </div>
            )}
          </div>
          <div className="bg-slate-50 p-4 dark:bg-slate-800/50">
            <Link
              href="/instructor/grading/pending"
              className="flex h-11 items-center justify-center rounded-2xl bg-white text-xs font-black tracking-widest text-slate-600 uppercase shadow-sm transition-all hover:bg-aerojet-blue hover:text-white hover:shadow-lg dark:bg-slate-900 dark:text-slate-400"
            >
              Enter Grading Hub
            </Link>
          </div>
        </div>
      </div>

      {/* Academy Activity & Notices */}
      <div className="rounded-3xl border border-slate-100 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Academy Activity</h2>
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instructorData.recentNotices.length > 0 ? (
            instructorData.recentNotices.map((notice) => (
              <Link
                key={notice.id}
                href={notice.link}
                className="group flex flex-col justify-between rounded-2xl border border-slate-50 bg-slate-50/30 p-5 transition-all hover:border-blue-200 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-800/20 dark:hover:bg-slate-800"
              >
                <div className="mb-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      notice.type === 'NEWS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      notice.type === 'EXAM' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {notice.type}
                    </span>
                    {notice.type === 'EXAM' && <Calendar className="h-3.5 w-3.5 text-red-400" />}
                    {notice.type === 'NEWS' && <Sparkles className="h-3.5 w-3.5 text-blue-400" />}
                    {notice.type === 'EVENT' && <Calendar className="h-3.5 w-3.5 text-purple-400" />}
                  </div>
                  <p className="text-sm font-black leading-snug text-slate-800 transition-colors group-hover:text-aerojet-blue dark:text-slate-200">
                    {notice.title}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(notice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))
          ) : (
            <p className="col-span-full py-10 text-center text-xs font-medium text-slate-400 italic">
              No new updates from administration.
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-3xl border border-slate-100 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-6 font-black text-slate-900 dark:text-white text-lg">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Take Attendance', href: '/instructor/classes' },
            { label: 'Enter Grades', href: '/instructor/grading/pending' },
            { label: 'Upload Materials', href: '/instructor/classes' },
            { label: 'View Students', href: '/instructor/students' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 px-6 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase transition-all hover:bg-aerojet-blue hover:text-white hover:shadow-lg hover:shadow-blue-500/20 dark:bg-slate-800 dark:text-slate-400"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

async function AsyncWelcomeBanner({ userName }: { userName?: string }) {
  const session = await getAuthSession()
  const role = session?.user?.role || 'STUDENT'
  const [welcomeMessages] = await Promise.all([getWelcomeMessages(prisma, role)])
  return <WelcomeBanner messages={welcomeMessages} userName={userName} />
}
