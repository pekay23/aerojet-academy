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
  const firstName = (session.user as any).name?.split(' ')[0]

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-slate-100" />}>
        <AsyncWelcomeBanner userName={firstName} />
      </Suspense>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Active Classes',
            value: instructorData.activeCohortsCount,
            icon: School,
            color: 'bg-blue-500',
          },
          {
            label: 'Total Students',
            value: instructorData.totalStudents,
            icon: Users,
            color: 'bg-green-500',
          },
          {
            label: 'Pending Grading',
            value: instructorData.pendingGradesCount,
            icon: ClipboardCheck,
            color: 'bg-orange-500',
          },
          {
            label: 'Classes Today',
            value: instructorData.todaysClasses.length,
            icon: Calendar,
            color: 'bg-purple-500',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div
                className={`h-10 w-10 ${stat.color} mb-3 flex items-center justify-center rounded-xl`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{stat.value}</p>
              <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {stat.label}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Classes */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 border-b border-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <Calendar className="h-4 w-4 text-slate-400" /> Today's Classes
            </h2>
            <Link
              href="/instructor/schedule"
              className="flex items-center gap-1 text-xs font-bold tracking-widest text-aerojet-sky uppercase hover:underline"
            >
              Full Schedule <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {instructorData.todaysClasses.length > 0 ? (
              instructorData.todaysClasses.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/instructor/classes/${cls.id}`}
                  className="group flex items-center justify-between px-4 py-3 transition-all hover:bg-slate-50 sm:px-6 sm:py-4 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                      <Clock className="h-5 w-5 text-aerojet-sky" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 transition-colors group-hover:text-aerojet-blue dark:text-slate-200">
                        {cls.course.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(cls.startDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {cls.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400">
                      {cls.currentStudents} students
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-12 text-center text-slate-400">
                <p className="text-sm">No classes scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Grading */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-50 px-6 py-5">
            <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <AlertCircle className="h-4 w-4 text-orange-500" /> Pending Grading
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {instructorData.pendingGradingDetails.length > 0 ? (
              instructorData.pendingGradingDetails.map((item, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-black text-aerojet-sky">{item.module}</span>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-black text-orange-600 uppercase">
                      Needs Grading
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{item.studentName}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {item.assessmentName} · {new Date(item.date).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm">Great job! All caught up.</p>
              </div>
            )}
          </div>
          <div className="border-t border-slate-50 p-4">
            <Link
              href="/instructor/grading/pending"
              className="block w-full rounded-xl bg-slate-50 py-3 text-center text-xs font-bold tracking-widest text-slate-600 uppercase transition-all hover:bg-aerojet-blue hover:text-white dark:bg-slate-800/50 dark:text-slate-400"
            >
              Go to Grading Hub
            </Link>
          </div>
        </div>
      </div>

      {/* Notices */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Instructor Notices</h2>
        <div className="space-y-4">
          {instructorData.recentNotices.length > 0 ? (
            instructorData.recentNotices.map((notice) => (
              <Link
                key={notice.id}
                href={`/news/${notice.slug}`}
                className="block border-l-4 border-blue-400 py-1 pl-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {notice.title}
                </p>
                <p className="text-[10px] text-slate-400">
                  {new Date(notice.publishedAt || '').toLocaleDateString()}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-xs text-slate-400">No new updates from administration.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2>
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-bold tracking-widest text-slate-600 uppercase transition-all hover:bg-aerojet-blue hover:text-white dark:bg-slate-800/50 dark:text-slate-400"
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
