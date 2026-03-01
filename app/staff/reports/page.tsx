import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import prisma from '@/lib/prisma/client'
import { getDashboardMetrics, formatCurrency } from '@/lib/analytics/metrics'
import { getEnrollmentTrends, getRevenueReport, getPoolAnalytics, getAttendanceReport } from '@/lib/analytics/reports'
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
    </div>
  )
}

/* ────────────────────────────── Enrollment Tab ────────────────────────────── */

async function EnrollmentTab() {
  const data = await getEnrollmentTrends()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[#002a5c] dark:text-white">Enrollment Trends</h2>
          <p className="text-slate-500 dark:text-slate-400">Breakdown of student enrollments by course</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="col-span-2 lg:col-span-2">
          <EnrollmentChart data={data} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 py-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Course Enrollment Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Course Code</th>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4 text-right">Total Enrollments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No enrollment data available.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.courseCode} className="hover:bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-6 py-4 font-bold text-slate-700">{item.courseCode}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{item.courseName}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-600 dark:text-slate-400">
                      {item.count}
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

/* ────────────────────────────── Revenue Tab ────────────────────────────── */

async function RevenueTab() {
  const { recentPayments, totalRevenue, chartData } = await getRevenueReport()

  const settings = await prisma.systemSetting.findMany({
    where: { key: 'course_currency' },
  })
  const currency = settings[0]?.value || 'EUR'

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#002a5c] dark:text-white">
              Revenue Report
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Financial overview and recent transactions
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Revenue</p>
          <h2 className="text-2xl font-black text-[#002a5c]">
            {formatCurrency(totalRevenue, currency)}
          </h2>
        </div>
      </div>

      <div className="mb-8">
        <RevenueChart data={chartData} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Recent Approved Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    No recent payment data available.
                  </td>
                </tr>
              ) : (
                recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {format(new Date(payment.updatedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex flex-col">
                        <span>
                          {payment.user.profile
                            ? `${payment.user.profile.firstName} ${payment.user.profile.lastName}`
                            : 'Unknown User'}
                        </span>
                        <span className="text-xs text-slate-400">{payment.user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {payment.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 uppercase dark:text-slate-400">
                        {payment.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">
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
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[#002a5c] dark:text-white">Pool Analytics</h2>
          <p className="text-slate-500 dark:text-slate-400">Exam pool logic performance and capacity utilization.</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="col-span-2 lg:col-span-2">
          <PoolFillChart data={chartData} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 py-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Exam Pool Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Pool Name / Logic</th>
                <th className="px-6 py-4">Exam Event</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No pool analytics data usually available.
                  </td>
                </tr>
              ) : (
                pools.map((pool) => {
                  const fillPercentage = Math.round(
                    (pool.currentMemberCount / pool.maxCandidates) * 100
                  )
                  return (
                    <tr key={pool.id} className="hover:bg-slate-50 dark:bg-slate-800/50">
                      <td className="px-6 py-4 font-bold text-slate-700">{pool.name}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{pool.event?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {format(new Date(pool.examDate), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium uppercase ${
                            pool.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : pool.status === 'FAILED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                          } `}
                        >
                          {pool.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {pool.currentMemberCount} / {pool.maxCandidates}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{fillPercentage}% Filled</span>
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
  )
}

/* ────────────────────────────── Attendance Tab ────────────────────────────── */

async function AttendanceTab() {
  const { records, chartData } = await getAttendanceReport()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[#002a5c] dark:text-white">Attendance Reports</h2>
          <p className="text-slate-500 dark:text-slate-400">Student attendance tracking and history</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="col-span-2 lg:col-span-1">
          <AttendanceChart data={chartData} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 py-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Recent Attendance Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Class/Event</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Recorded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {format(new Date(record.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      {record.user.profile
                        ? `${record.user.profile.firstName} ${record.user.profile.lastName}`
                        : record.user.email}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {record.class?.name || 'Unknown Class'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium uppercase ${
                          record.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : record.status === 'ABSENT'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        } `}
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
    <ReportsTabs>
      {tab === 'overview' && <OverviewTab />}
      {tab === 'enrollment' && <EnrollmentTab />}
      {tab === 'revenue' && <RevenueTab />}
      {tab === 'pools' && <PoolsTab />}
      {tab === 'attendance' && <AttendanceTab />}
    </ReportsTabs>
  )
}
