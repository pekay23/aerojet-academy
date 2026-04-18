import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { TrendingUp, Users, DollarSign, Calendar, Sparkles, AlertTriangle, ArrowUpRight, ArrowDownRight, Award, Zap } from 'lucide-react'
import { Metadata } from 'next'
import { format } from 'date-fns'
import prisma from '@/lib/prisma/client'
import { getSystemSetting } from '@/lib/settings'
import { Badge } from '@/components/ui/badge'
import { getDashboardMetrics, formatCurrency, getTopCourses, getAttendanceRate } from '@/lib/analytics/metrics'
import {
  getEnrollmentTrends,
  getRevenueReport,
  getPoolAnalytics,
  getAttendanceReport,
  getCriticalAlerts,
  getFinanceReportSummary,
} from '@/lib/analytics/reports'
import { EnrollmentChart } from '@/components/charts/EnrollmentChart'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { PoolFillChart } from '@/components/charts/PoolFillChart'
import { AttendanceChart } from '@/components/charts/AttendanceChart'
import ReportsTabs from '../_components/ReportsTabs'
import { PeriodFilter } from './_components/PeriodFilter'
import { Sparkline } from './_components/Sparkline'

export const metadata: Metadata = { title: 'Reports | Staff Portal' }

/* ────────────────────────────── Overview Tab ────────────────────────────── */

interface MetricCardProps {
  title: string
  value: string | number
  growth?: number
  icon: any
  color: string
  label: string
}

function MetricCard({ title, value, growth, icon: Icon, color, label }: MetricCardProps) {
  const isPositive = (growth || 0) >= 0

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.03] transition-transform group-hover:scale-150 ${color}`} />
      
      <div className="relative flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color.replace('bg-', 'bg-').replace('text-', 'text-')} ring-4 ring-white transition-transform group-hover:scale-110 dark:ring-slate-900`}>
          <Icon className="h-6 w-6" />
        </div>
        
        {growth !== undefined && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
            isPositive 
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(growth)}%
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          {title}
        </p>
        <div className="flex items-end justify-between gap-2">
          <h3 className="text-3xl font-black text-aerojet-blue dark:text-slate-100">
            {value}
          </h3>
          <Sparkline data={[]} color={isPositive ? '#10b981' : '#ef4444'} />
        </div>
        <p className="mt-1 text-xs font-medium text-slate-400">
          {label}
        </p>
      </div>
    </div>
  )
}

async function OverviewTab({ period, from, to }: { period: string, from?: string, to?: string }) {
  const fromDate = from ? new Date(from) : undefined
  const toDate = to ? new Date(to) : undefined

  const [metrics, topCourses, alerts] = await Promise.all([
    getDashboardMetrics(period, fromDate, toDate),
    getTopCourses(5),
    getCriticalAlerts()
  ])

  let periodLabel = 'vs last period'
  if (period === 'wow') periodLabel = 'vs last week'
  if (period === 'mom') periodLabel = 'vs last month'
  if (period === 'yoy') periodLabel = 'vs last year'
  if (period === 'day' || period === '24h') periodLabel = 'vs previous 24h'
  if (period === '4h') periodLabel = 'vs previous 4h'
  if (period === '1h') periodLabel = 'vs previous hour'
  if (period === 'custom') periodLabel = 'vs previous interval'

  return (
    <div className="mx-auto max-w-[1920px] animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Metric Cards Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Students"
          value={metrics.totalStudents.value}
          growth={metrics.totalStudents.growth}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          label={periodLabel}
        />
        <MetricCard 
          title="Active Enrollments"
          value={metrics.activeEnrollments.value}
          growth={metrics.activeEnrollments.growth}
          icon={TrendingUp}
          color="bg-indigo-50 text-indigo-600"
          label={periodLabel}
        />
        <MetricCard 
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue.value)}
          growth={metrics.totalRevenue.growth}
          icon={DollarSign}
          color="bg-amber-50 text-amber-600"
          label={periodLabel}
        />
        <MetricCard 
          title="Pending Items"
          value={metrics.pendingPayments}
          icon={Zap}
          color="bg-purple-50 text-purple-600"
          label="Awaiting action"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Courses */}
        <div className="lg:col-span-2">
          <div className="h-full rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-aerojet-blue dark:text-white">Top Performing Courses</h3>
                <p className="text-sm font-medium text-slate-400">By total student enrollment</p>
              </div>
              <Award className="h-6 w-6 text-amber-500" />
            </div>

            <div className="space-y-4">
              {topCourses.map((course, index) => (
                <div key={course.id} className="flex items-center gap-4 rounded-2xl border border-slate-50 bg-slate-50/30 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:bg-slate-800/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-aerojet-blue shadow-sm dark:bg-slate-700 dark:text-slate-100">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-black text-aerojet-blue dark:text-slate-100">{course.name}</p>
                    <p className="text-xs font-mono text-slate-400 uppercase">{course.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-aerojet-blue dark:text-slate-100">{course.enrollments}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Students</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="lg:col-span-1">
          <div className="h-full rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-aerojet-blue dark:text-white">Operational Alerts</h3>
                <p className="text-sm font-medium text-slate-400">Critical items needing attention</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>

            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-emerald-50 p-3 text-emerald-500 dark:bg-emerald-900/20">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="font-bold text-emerald-600">All systems clear!</p>
                  <p className="text-xs text-slate-400">No critical alerts at this time.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-start gap-4 rounded-2xl border p-4 ${
                    alert.type === 'CRITICAL' 
                      ? 'border-red-100 bg-red-50/30 text-red-700 dark:border-red-900/20 dark:bg-red-900/10 dark:text-red-400'
                      : 'border-amber-100 bg-amber-50/30 text-amber-700 dark:border-amber-900/20 dark:bg-amber-900/10 dark:text-amber-400'
                  }`}>
                    <div className="mt-0.5">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{alert.category}</p>
                      <p className="text-xs font-bold leading-tight">{alert.message}</p>
                      {alert.date && (
                        <p className="text-[10px] font-medium opacity-60">
                          Due: {format(new Date(alert.date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button className="mt-8 w-full rounded-2xl bg-aerojet-blue px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] hover:bg-aerojet-blue/90 active:scale-[0.98]">
              Refresh Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────── Enrollment Tab ────────────────────────────── */

async function EnrollmentTab() {
  const data = await getEnrollmentTrends()

  const totalEnrollments = data.reduce((sum, item) => sum + item.count, 0)
  const averagePerCourse = data.length > 0 ? Math.round(totalEnrollments / data.length) : 0
  const topCourse = data[0]

  return (
    <div className="mx-auto max-w-[1920px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
          <TrendingUp className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Enrollment Trends
          </h2>
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-aerojet-sky" />
            Real-time breakdown of module enrollments
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Enrollments"
          value={totalEnrollments}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          label="Across all active modules"
        />
        <MetricCard
          title="Avg. Enrollments"
          value={averagePerCourse}
          icon={TrendingUp}
          color="bg-indigo-50 text-indigo-600"
          label="Per course average"
        />
        <MetricCard
          title="Top Performer"
          value={topCourse?.count || 0}
          icon={Award}
          color="bg-amber-50 text-amber-600"
          label={topCourse?.courseCode || 'No data'}
        />
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <EnrollmentChart data={data} />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-50 bg-slate-50/30 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
            <h3 className="text-sm font-black tracking-widest text-aerojet-blue uppercase dark:text-slate-100">
              Module Enrollment Detail
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Course Name</th>
                  <th className="px-6 py-5 text-right">Total Enrollments</th>
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
                      className="group transition-all duration-150 ease-out hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {item.courseCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-aerojet-blue dark:text-slate-100">
                        {item.courseName}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <span className="text-xl font-black text-aerojet-blue dark:text-slate-100">
                            {item.count}
                          </span>
                          <div className={`h-2 w-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden`}>
                             <div 
                              className="h-full bg-blue-500" 
                              style={{ width: `${Math.min((item.count / (topCourse?.count || 1)) * 100, 100)}%` }}
                             />
                          </div>
                        </div>
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
  const [report, summary] = await Promise.all([
    getRevenueReport(),
    getFinanceReportSummary()
  ])

  const { recentPayments, totalRevenue, chartData } = report
  const currency = await getSystemSetting('course_currency', 'EUR')

  return (
    <div className="mx-auto max-w-[1920px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20">
            <DollarSign className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white">
              Revenue Analytics
            </h2>
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-aerojet-sky" />
              Financial overview and recent transactions
            </p>
          </div>
        </div>
        <div className="hidden rounded-2xl border border-slate-100 bg-white px-6 py-4 text-right shadow-sm sm:block dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Total Approved Revenue
          </p>
          <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalRevenue, currency)}
          </h2>
        </div>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenue (MTD)"
          value={formatCurrency(summary.revenueThisMonth, currency)}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          label={`${summary.monthCount} transactions`}
        />
        <MetricCard
          title="Avg Transaction"
          value={formatCurrency(summary.avgTransactionValue, currency)}
          icon={DollarSign}
          color="bg-amber-50 text-amber-600"
          label="Per successful payment"
        />
        <MetricCard
          title="Revenue (YTD)"
          value={formatCurrency(summary.revenueThisYear, currency)}
          icon={Award}
          color="bg-indigo-50 text-indigo-600"
          label="Calendar year total"
        />
        <MetricCard
          title="Pending Amount"
          value={formatCurrency(summary.pendingAmount, currency)}
          icon={Zap}
          color="bg-purple-50 text-purple-600"
          label={`${summary.pendingCount} awaiting approval`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6">
              <h3 className="text-lg font-black text-aerojet-blue dark:text-white">Revenue Growth</h3>
              <p className="text-sm font-medium text-slate-400">Last 6 months performance</p>
            </div>
            <RevenueChart data={chartData} />
          </div>
        </div>
      </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-50 bg-slate-50/30 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
            <h3 className="text-sm font-black tracking-widest text-aerojet-blue uppercase dark:text-slate-100">
              Recent Transactions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Student</th>
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
                      className="group transition-all duration-150 ease-out hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                        {format(new Date(payment.updatedAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-aerojet-blue dark:text-slate-100">
                            {payment.user.profile
                              ? `${payment.user.profile.firstName} ${payment.user.profile.lastName}`
                              : 'Unknown User'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {payment.user.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="secondary"
                          className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600 dark:bg-slate-800"
                        >
                          {payment.paymentMethod || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-aerojet-blue dark:text-slate-100">
                        {formatCurrency(Number(payment.amount), currency)}
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

  const activePools = pools.length
  const totalCapacity = pools.reduce((sum, p) => sum + p.maxCandidates, 0)
  const totalMembers = pools.reduce((sum, p) => sum + p.currentMemberCount, 0)
  const avgUtilization = totalCapacity > 0 ? Math.round((totalMembers / totalCapacity) * 100) : 0
  const pendingSeats = totalCapacity - totalMembers

  return (
    <div className="mx-auto max-w-[1920px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20">
          <Calendar className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Booking Analytics
          </h2>
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-aerojet-sky" />
            Exam booking performance and capacity utilization.
          </p>
        </div>
      </div>

      {/* Utilization Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Active Pools"
          value={activePools}
          icon={Calendar}
          color="bg-indigo-50 text-indigo-600"
          label="Currently monitored"
        />
        <MetricCard
          title="Avg Utilization"
          value={`${avgUtilization}%`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          label="Capacity fill rate"
        />
        <MetricCard
          title="Pending Seats"
          value={pendingSeats}
          icon={Users}
          color="bg-amber-50 text-amber-600"
          label="Available across all pools"
        />
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
           <div className="mb-6">
            <h3 className="text-lg font-black text-aerojet-blue dark:text-white">Capacity Timeline</h3>
            <p className="text-sm font-medium text-slate-400">Fill rate percentage per pool</p>
          </div>
          <PoolFillChart data={chartData} />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
            <h3 className="text-sm font-black tracking-widest text-aerojet-blue uppercase dark:text-slate-100">
              Exam Booking Detailed Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4">Booking Name</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Exam Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Utilization</th>
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
                        className="group transition-all duration-150 ease-out hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-4 text-base font-black text-aerojet-blue dark:text-white">
                          {pool.name}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-400">
                          {pool.event?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {format(new Date(pool.examDate), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
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
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2">
                               <span className="text-lg font-black text-aerojet-blue dark:text-slate-100">
                                {pool.currentMemberCount}
                              </span>
                              <span className="text-xs font-bold text-slate-400">/ {pool.maxCandidates}</span>
                            </div>
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  fillPercentage > 90
                                    ? 'bg-amber-500'
                                    : fillPercentage > 75
                                      ? 'bg-blue-500'
                                      : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                              />
                            </div>
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
  const [report, metrics] = await Promise.all([
    getAttendanceReport(),
    getAttendanceRate()
  ])

  const { records, chartData } = report

  return (
    <div className="mx-auto max-w-[1920px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
          <Calendar className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Attendance Reports
          </h2>
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-aerojet-sky" />
            Real-time student attendance tracking and metrics.
          </p>
        </div>
      </div>

      {/* Attendance Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Overall Rate"
          value={`${metrics.rate}%`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          label="Average participation"
        />
        <MetricCard
          title="Present Today"
          value={metrics.present}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          label="Total present instances"
        />
        <MetricCard
          title="Absent/Late"
          value={metrics.absent}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
          label="Needing follow-up"
        />
        <MetricCard
          title="Total Logs"
          value={metrics.total}
          icon={Calendar}
          color="bg-indigo-50 text-indigo-600"
          label="Total records tracked"
        />
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
           <div className="mb-6">
            <h3 className="text-lg font-black text-aerojet-blue dark:text-white">Status Breakdown</h3>
            <p className="text-sm font-medium text-slate-400">Distribution of attendance markers</p>
          </div>
          <AttendanceChart data={chartData} />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
            <h3 className="text-sm font-black tracking-widest text-aerojet-blue uppercase dark:text-slate-100">
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
                  <th className="px-6 py-4 text-center">Status</th>
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
                  records.map((record: any) => (
                    <tr
                      key={record.id}
                      className="group transition-all duration-150 ease-out hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                        {format(new Date(record.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 font-black text-aerojet-blue dark:text-slate-100">
                        {record.user.profile
                          ? `${record.user.profile.firstName} ${record.user.profile.lastName}`
                          : record.user.email}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-400">
                        {record.class?.name || 'Unknown Class'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
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
  searchParams: Promise<{ tab?: string; period?: string; from?: string; to?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { tab = 'overview', period = 'mom', from, to } = await searchParams

  return (
    <div className="mx-auto max-w-[1920px] space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue sm:text-4xl dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-5 w-5 text-aerojet-sky" />
            Comprehensive reports and insights for Aerojet Academy.
          </p>
        </div>

        {tab === 'overview' && <PeriodFilter />}
      </div>

      <ReportsTabs>
        <div className="mt-8">
          {tab === 'overview' && <OverviewTab period={period} from={from} to={to} />}
          {tab === 'enrollment' && <EnrollmentTab />}
          {tab === 'revenue' && <RevenueTab />}
          {tab === 'pools' && <PoolsTab />}
          {tab === 'attendance' && <AttendanceTab />}
        </div>
      </ReportsTabs>
    </div>
  )
}
