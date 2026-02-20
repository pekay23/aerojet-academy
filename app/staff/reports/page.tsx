import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { getDashboardMetrics, formatCurrency } from '@/lib/analytics/metrics'

export const metadata: Metadata = { title: 'Reports Overview | Staff Portal' }

export default async function ReportsOverviewPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const metrics = await getDashboardMetrics()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Reports Overview</h1>
        <p className="text-slate-500 dark:text-slate-400">Key metrics and analytics for the academy.</p>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Total Students</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{metrics.totalStudents}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Enrollments</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{metrics.activeEnrollments}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Total Revenue</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(metrics.totalRevenue)}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Open Exam Pools</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{metrics.openPools}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/staff/reports/enrollment-trends"
          className="group rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">Enrollment Trends</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Analyze student enrollment patterns over time.</p>
        </Link>

        <Link
          href="/staff/reports/revenue"
          className="group rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">Revenue Reports</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Detailed breakdown of income streams and payments.
          </p>
        </Link>

        <Link
          href="/staff/reports/pool-analytics"
          className="group rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">Pool Analytics</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Exam pool logic performance and capacity utilization.
          </p>
        </Link>

        <Link
          href="/staff/reports/attendance"
          className="group rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
            <Calendar className="h-5 w-5" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">Attendance Reports</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track student attendance across classes and exams.
          </p>
        </Link>
      </div>
    </div>
  )
}
