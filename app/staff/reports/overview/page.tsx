import { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import {
  TrendingUp,
  Users,
  DollarSign,
  Sparkles,
  AlertTriangle,
  Award,
  Zap,
} from 'lucide-react'
import { format } from 'date-fns'
import {
  getDashboardMetrics,
  formatCurrency,
  getTopCourses,
} from '@/lib/analytics/metrics'
import { getCriticalAlerts } from '@/lib/analytics/reports'
import { PeriodFilter } from '../_components/PeriodFilter'
import MetricCard from '../_components/MetricCard'
import { RefreshAnalyticsButton } from '../_components/RefreshAnalyticsButton'

export const metadata: Metadata = { title: 'Reports Overview | Staff Portal' }
export const dynamic = 'force-dynamic'

interface OverviewPageProps {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}

async function getOverviewData(period: string, from?: string, to?: string) {
  const fromDate = from ? new Date(from) : undefined
  const toDate = to ? new Date(to) : undefined

  const [metrics, topCourses, alerts] = await Promise.all([
    getDashboardMetrics(period, fromDate, toDate),
    getTopCourses(5),
    getCriticalAlerts(),
  ])

  return { metrics, topCourses, alerts }
}

function getPeriodLabel(period: string): string {
  switch (period) {
    case 'wow':
      return 'vs last week'
    case 'mom':
      return 'vs last month'
    case 'yoy':
      return 'vs last year'
    case 'day':
    case '24h':
      return 'vs previous 24h'
    case '4h':
      return 'vs previous 4h'
    case '1h':
      return 'vs previous hour'
    case 'custom':
      return 'vs previous interval'
    default:
      return 'vs last period'
  }
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const params = await searchParams
  const period = params.period || 'mom'
  const from = params.from
  const to = params.to
  const periodLabel = getPeriodLabel(period)

  const { metrics, topCourses, alerts } = await getOverviewData(period, from, to)

  return (
    <div className="mx-auto max-w-[1920px] space-y-8">
      <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue sm:text-4xl dark:text-white">
            Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Key metrics and operational alerts at a glance.
          </p>
        </div>
        <Link
          href="/staff/reports"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
        >
          ← All Reports
        </Link>
      </div>

      <PeriodFilter />

      {/* Metric Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                <h3 className="text-aerojet-blue text-lg font-black dark:text-white">
                  Top Performing Courses
                </h3>
                <p className="text-sm font-medium text-slate-400">By total student enrollment</p>
              </div>
              <Award className="h-6 w-6 text-amber-500" />
            </div>

            <div className="space-y-4">
              {topCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-50 bg-slate-50/30 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
                >
                  <div className="text-aerojet-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black shadow-sm dark:bg-slate-700 dark:text-slate-100">
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-aerojet-blue truncate font-black dark:text-slate-100">
                      {course.name}
                    </p>
                    <p className="font-mono text-xs text-slate-400 uppercase">{course.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-aerojet-blue text-lg font-black dark:text-slate-100">
                      {course.enrollments}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Students</p>
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
                <h3 className="text-aerojet-blue text-lg font-black dark:text-white">
                  Operational Alerts
                </h3>
                <p className="text-sm font-medium text-slate-400">
                  Critical items needing attention
                </p>
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
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 rounded-2xl border p-4 ${
                      alert.type === 'CRITICAL'
                        ? 'border-red-100 bg-red-50/30 text-red-700 dark:border-red-900/20 dark:bg-red-900/10 dark:text-red-400'
                        : 'border-amber-100 bg-amber-50/30 text-amber-700 dark:border-amber-900/20 dark:bg-amber-900/10 dark:text-amber-400'
                    }`}
                  >
                    <div className="mt-0.5">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[11px] font-black tracking-widest uppercase opacity-60">
                        {alert.category}
                      </p>
                      <p className="text-xs leading-tight font-bold">{alert.message}</p>
                      {alert.date && (
                        <p className="text-[11px] font-medium opacity-60">
                          Due: {format(new Date(alert.date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <RefreshAnalyticsButton />
          </div>
        </div>
      </div>
    </div>
  )
}