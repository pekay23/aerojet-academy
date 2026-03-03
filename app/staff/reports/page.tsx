import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { TrendingUp, Users, DollarSign, Calendar, Sparkles } from 'lucide-react'
import { Metadata } from 'next'
import { format } from 'date-fns'
import prisma from '@/lib/prisma/client'
import { Badge } from '@/components/ui/badge'
import { getDashboardMetrics, formatCurrency } from '@/lib/analytics/metrics'
import {
  getEnrollmentTrends,
  getRevenueReport,
  getPoolAnalytics,
  getAttendanceReport,
} from '@/lib/analytics/reports'
import { EnrollmentChart } from '@/components/charts/EnrollmentChart'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { PoolFillChart } from '@/components/charts/PoolFillChart'
import { AttendanceChart } from '@/components/charts/AttendanceChart'
import ReportsTabs from '../_components/ReportsTabs'

export const metadata: Metadata = { title: 'Reports | Staff Portal' }

/* ────────────────────────────── Overview Tab ────────────────────────────── */

async function OverviewTab() {
  const metrics = await getDashboardMetrics()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards */}
        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-900/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Total Students
              </p>
              <h3 className="text-2xl font-black text-[#002a5c] dark:text-slate-100">
                {metrics.totalStudents}
              </h3>
            </div>
          </div>
        </div>

        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110 dark:bg-indigo-900/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Enrollments
              </p>
              <h3 className="text-2xl font-black text-[#002a5c] dark:text-slate-100">
                {metrics.activeEnrollments}
              </h3>
            </div>
          </div>
        </div>

        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110 dark:bg-amber-900/20">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Total Revenue
              </p>
              <h3 className="text-2xl font-black text-[#002a5c] dark:text-slate-100">
                {formatCurrency(metrics.totalRevenue)}
              </h3>
            </div>
          </div>
        </div>

        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-110 dark:bg-purple-900/20">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Open Exam Pools
              </p>
              <h3 className="text-2xl font-black text-[#002a5c] dark:text-slate-100">
                {metrics.openPools}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────── Enrollment Tab ────────────────────────────── */

async function EnrollmentTab() {
  const data = await getEnrollmentTrends()

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
          <TrendingUp className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#002a5c] dark:text-white">
            Enrollment Trends
          </h2>
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-[#4c9ded]" />
            Real-time breakdown of module enrollments
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <EnrollmentChart data={data} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
            <h3 className="text-sm font-black tracking-widest text-[#002a5c] uppercase dark:text-slate-100">
              Module Enrollment Detail
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Course Name</th>
                  <th className="px-6 py-4 text-right">Total Enrollments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-12 text-center text-sm font-medium text-slate-400 italic"
                    >
                      No enrollment data available.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr
                      key={item.courseCode}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-500 dark:text-slate-400">
                        {item.courseCode}
                      </td>
                      <td className="px-6 py-4 text-base font-bold text-slate-900 dark:text-slate-100">
                        {item.courseName}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="rounded-lg bg-blue-50 px-3 py-1 font-mono text-sm font-black text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          {item.count}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────── Revenue Tab ────────────────────────────── */

async function RevenueTab() {
  const { recentPayments, totalRevenue, chartData } = await getRevenueReport()

  const settings = await prisma.systemSetting.findMany({
    where: { key: 'course_currency' },
  })
  const currency = settings[0]?.value || 'EUR'

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20">
            <DollarSign className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#002a5c] dark:text-white">
              Revenue Analytics
            </h2>
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-[#4c9ded]" />
              Financial overview and recent transactions
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-4 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Total Revenue
          </p>
          <h2 className="text-2xl font-black text-[#002a5c] dark:text-white">
            {formatCurrency(totalRevenue, currency)}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 text-lg font-bold shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <RevenueChart data={chartData} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <h3 className="text-sm font-black tracking-widest text-[#002a5c] uppercase dark:text-slate-100">
            Recent Transactions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm font-medium text-slate-400 italic"
                  >
                    No recent payment data available.
                  </td>
                </tr>
              ) : (
                recentPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="text-lg font-bold transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 font-mono text-sm text-slate-400">
                      {format(new Date(payment.updatedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#002a5c] dark:text-slate-100">
                          {payment.user.profile
                            ? `${payment.user.profile.firstName} ${payment.user.profile.lastName}`
                            : 'Unknown User'}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {payment.user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                      #{payment.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase"
                      >
                        {payment.paymentMethod || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(payment.amount, currency)}
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

/* ────────────────────────────── Pools Tab ────────────────────────────── */

async function PoolsTab() {
  const { pools, chartData } = await getPoolAnalytics()

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20">
          <Calendar className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#002a5c] dark:text-white">
            Pool Analytics
          </h2>
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-[#4c9ded]" />
            Exam pool performance and capacity utilization.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <PoolFillChart data={chartData} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
            <h3 className="text-sm font-black tracking-widest text-[#002a5c] uppercase dark:text-slate-100">
              Exam Pool Detailed Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4">Pool Name</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Exam Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Capacity / Fill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pools.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm font-medium text-slate-400 italic"
                    >
                      No pool analytics data available.
                    </td>
                  </tr>
                ) : (
                  pools.map((pool) => {
                    const fillPercentage = Math.round(
                      (pool.currentMemberCount / pool.maxCandidates) * 100
                    )
                    return (
                      <tr
                        key={pool.id}
                        className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-6 py-4 text-base font-bold text-[#002a5c] dark:text-white">
                          {pool.name}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                          {pool.event?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {format(new Date(pool.examDate), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide uppercase ${
                              pool.status === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                : pool.status === 'FAILED'
                                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}
                          >
                            {pool.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-mono text-sm font-black text-[#002a5c] dark:text-slate-100">
                              {pool.currentMemberCount} / {pool.maxCandidates}
                            </span>
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={`h-full transition-all ${
                                  fillPercentage > 90
                                    ? 'bg-amber-500'
                                    : fillPercentage > 75
                                      ? 'bg-blue-500'
                                      : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                              {fillPercentage}% Filled
                            </span>
                          </div>
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
    </div>
  )
}

/* ────────────────────────────── Attendance Tab ────────────────────────────── */

async function AttendanceTab() {
  const { records, chartData } = await getAttendanceReport()

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
          <Calendar className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#002a5c] dark:text-white">
            Attendance Reports
          </h2>
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-[#4c9ded]" />
            Real-time student attendance tracking and metrics.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <AttendanceChart data={chartData} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
            <h3 className="text-sm font-black tracking-widest text-[#002a5c] uppercase dark:text-slate-100">
              Recent Attendance History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Module / Event</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm font-medium text-slate-400 italic"
                    >
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr
                      key={record.id}
                      className="text-lg font-bold transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4 font-mono text-sm text-slate-400">
                        {format(new Date(record.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#002a5c] dark:text-slate-100">
                        {record.user.profile
                          ? `${record.user.profile.firstName} ${record.user.profile.lastName}`
                          : record.user.email}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                        {record.class?.name || 'Unknown Class'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide uppercase ${
                            record.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                              : record.status === 'ABSENT'
                                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                        {format(new Date(record.createdAt), 'HH:mm')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────── Main Page ────────────────────────────── */

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { tab = 'overview' } = await searchParams

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-[#002a5c] sm:text-4xl dark:text-white">
          Analytics Dashboard
        </h1>
        <p className="flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
          <Sparkles className="h-5 w-5 text-[#4c9ded]" />
          Comprehensive reports and insights for Aerojet Academy.
        </p>
      </div>

      <ReportsTabs>
        <div className="mt-8">
          {tab === 'overview' && <OverviewTab />}
          {tab === 'enrollment' && <EnrollmentTab />}
          {tab === 'revenue' && <RevenueTab />}
          {tab === 'pools' && <PoolsTab />}
          {tab === 'attendance' && <AttendanceTab />}
        </div>
      </ReportsTabs>
    </div>
  )
}
