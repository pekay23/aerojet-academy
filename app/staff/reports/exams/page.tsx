import { Metadata } from 'next'
import Link from 'next/link'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import React from 'react'
import { TrendingUp, Award, Calendar, Zap } from 'lucide-react'
import { getExamAnalytics } from '@/lib/analytics/reports'
import {
  ExamTrendChart,
  ScoreDistributionChart,
} from '../_components/ReportCharts'
import MetricCard from '../_components/MetricCard'

export const metadata: Metadata = { title: 'Exam Analytics | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function ExamsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const analytics = await getExamAnalytics()

  const scoreChartData = [
    { range: '0–25%', count: analytics.scoreDistribution['0-25'], color: '#EF4444' },
    { range: '26–50%', count: analytics.scoreDistribution['26-50'], color: '#F59E0B' },
    { range: '51–74%', count: analytics.scoreDistribution['51-74'], color: '#3B82F6' },
    { range: '75–100%', count: analytics.scoreDistribution['75-100'], color: '#10B981' },
  ]

  return (
    <div className="mx-auto max-w-[1920px] space-y-8">
      <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue sm:text-4xl dark:text-white">
            Exam Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pass rates, attempt breakdowns, score distributions, and module performance.
          </p>
        </div>
        <Link
          href="/staff/reports"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
        >
          ← All Reports
        </Link>
      </div>

      {/* Top-line KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Overall Pass Rate"
          value={`${analytics.passPercentage}%`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          label={`${analytics.passed} passes / ${analytics.total} graded results`}
        />
        <MetricCard
          title="1st Attempt Pass Rate"
          value={`${analytics.firstAttemptPassRate}%`}
          icon={Award}
          color="bg-blue-50 text-blue-600"
          label={`${analytics.firstAttemptPass} of ${analytics.firstAttemptTotal} first attempts`}
        />
        <MetricCard
          title="Resit Pass Rate"
          value={`${analytics.resitPassRate}%`}
          icon={Calendar}
          color="bg-amber-50 text-amber-600"
          label={`${analytics.resitPass} of ${analytics.resitTotal} resit attempts`}
        />
        <MetricCard
          title="Awaiting Grading"
          value={analytics.awaitingGrading}
          icon={Zap}
          color="bg-purple-50 text-purple-600"
          label={`${analytics.pendingScheduling} bookings still pending scheduling`}
        />
      </div>

      {/* Pass / Fail / Category Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pass vs Fail Donut */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-aerojet-blue text-sm font-black tracking-widest uppercase dark:text-white">
            Pass vs Fail
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-900/10">
              <p className="text-3xl font-black text-emerald-600">{analytics.passed}</p>
              <p className="mt-1 text-xs font-bold text-emerald-400 uppercase">Passed</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${analytics.passPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] font-bold text-emerald-500">
                {analytics.passPercentage}%
              </p>
            </div>
            <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/10">
              <p className="text-3xl font-black text-red-600">{analytics.failed}</p>
              <p className="mt-1 text-xs font-bold text-red-400 uppercase">Failed</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-red-100 dark:bg-red-900/30">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${analytics.failPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] font-bold text-red-500">{analytics.failPercentage}%</p>
            </div>
          </div>
        </div>

        {/* EASA vs Internal */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-aerojet-blue text-sm font-black tracking-widest uppercase dark:text-white">
            By Category
          </h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <span className="text-aerojet-blue text-xs font-black uppercase dark:text-white">
                  EASA Official
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-black text-blue-600">
                  {analytics.easaPassRate}% pass
                </span>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-slate-500">
                <span>
                  <strong className="text-emerald-600">{analytics.easa.passed}</strong> pass
                </span>
                <span>
                  <strong className="text-red-500">{analytics.easa.failed}</strong> fail
                </span>
                <span>
                  <strong className="text-slate-600">{analytics.easa.total}</strong> total
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <span className="text-aerojet-blue text-xs font-black uppercase dark:text-white">
                  Academy Internal
                </span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-black text-indigo-600">
                  {analytics.internalPassRate}% pass
                </span>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-slate-500">
                <span>
                  <strong className="text-emerald-600">{analytics.internal.passed}</strong> pass
                </span>
                <span>
                  <strong className="text-red-500">{analytics.internal.failed}</strong> fail
                </span>
                <span>
                  <strong className="text-slate-600">{analytics.internal.total}</strong> total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Attempt Breakdown */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-aerojet-blue text-sm font-black tracking-widest uppercase dark:text-white">
            Attempt Distribution
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 dark:bg-blue-900/10">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-blue-600">{analytics.attempts.FIRST}</p>
                <span className="rounded-full bg-blue-100/50 px-1.5 py-0.5 text-[11px] font-black text-blue-400 dark:bg-blue-800/30">
                  {analytics.firstAttemptPassRate}% Pass
                </span>
              </div>
              <p className="mt-1 text-[11px] font-bold tracking-widest text-blue-400 uppercase">
                1st Attempt
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-900/10">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-amber-600">{analytics.attempts.RESIT_1}</p>
                <span className="rounded-full bg-amber-100/50 px-1.5 py-0.5 text-[11px] font-black text-amber-400 dark:bg-amber-800/30">
                  {analytics.resit1PassRate}% Pass
                </span>
              </div>
              <p className="mt-1 text-[11px] font-bold tracking-widest text-amber-400 uppercase">
                1st Resit
              </p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-3 dark:bg-orange-900/10">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-orange-600">{analytics.attempts.RESIT_2}</p>
                <span className="rounded-full bg-orange-100/50 px-1.5 py-0.5 text-[11px] font-black text-orange-400 dark:bg-orange-800/30">
                  {analytics.resit2PassRate}% Pass
                </span>
              </div>
              <p className="mt-1 text-[11px] font-bold tracking-widest text-orange-400 uppercase">
                2nd Resit
              </p>
            </div>
            <div className="rounded-2xl bg-red-50 p-3 dark:bg-red-900/10">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-red-600">{analytics.attempts.RESIT_3}</p>
                <span className="rounded-full bg-red-100/50 px-1.5 py-0.5 text-[11px] font-black text-red-400 dark:bg-red-800/30">
                  {analytics.resit3PassRate}% Pass
                </span>
              </div>
              <p className="mt-1 text-[11px] font-bold tracking-widest text-red-400 uppercase">
                3rd+ Resit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-aerojet-blue text-sm font-black tracking-widest uppercase dark:text-white">
              Monthly Volume (12 Months)
            </h3>
            <p className="text-xs font-medium text-slate-400">
              Booking volume with graded pass/fail overlay
            </p>
          </div>
          <ExamTrendChart data={analytics.monthlyTrend} />
        </div>

        {/* Score Distribution */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-aerojet-blue text-sm font-black tracking-widest uppercase dark:text-white">
              Score Distribution
            </h3>
            <p className="text-xs font-medium text-slate-400">
              Spread of exam scores across ranges
            </p>
          </div>
          <ScoreDistributionChart data={scoreChartData} />
        </div>
      </div>

      {/* Module Performance Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hardest Modules */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-red-50/30 px-6 py-4 dark:border-slate-800 dark:bg-red-900/5">
            <h3 className="text-sm font-black tracking-widest text-red-600 uppercase dark:text-red-400">
              Hardest Modules
            </h3>
            <p className="text-xs font-medium text-red-400/60">Lowest pass rates</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Hardest modules by pass rate showing module code, total attempts, passes, fails, and pass rate</caption>
              <thead className="bg-slate-50/50 text-[11px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-5 py-3">Module</th>
                  <th className="px-5 py-3 text-center">Total</th>
                  <th className="px-5 py-3 text-center">Pass</th>
                  <th className="px-5 py-3 text-center">Fail</th>
                  <th className="px-5 py-3 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {analytics.hardestModules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400 italic">
                      No module data available
                    </td>
                  </tr>
                ) : (
                  analytics.hardestModules.map((m) => (
                    <tr
                      key={m.moduleCode}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3">
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {m.moduleCode}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {m.total}
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-emerald-600">
                        {m.passed}
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-red-500">{m.failed}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full bg-red-500"
                              style={{ width: `${m.passRate}%` }}
                            />
                          </div>
                          <span className="text-aerojet-blue font-black">{m.passRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Easiest Modules */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-emerald-50/30 px-6 py-4 dark:border-slate-800 dark:bg-emerald-900/5">
            <h3 className="text-sm font-black tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
              Easiest Modules
            </h3>
            <p className="text-xs font-medium text-emerald-400/60">Highest pass rates</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Easiest modules by pass rate showing module code, total attempts, passes, fails, and pass rate</caption>
              <thead className="bg-slate-50/50 text-[11px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-5 py-3">Module</th>
                  <th className="px-5 py-3 text-center">Total</th>
                  <th className="px-5 py-3 text-center">Pass</th>
                  <th className="px-5 py-3 text-center">Fail</th>
                  <th className="px-5 py-3 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {analytics.easiestModules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400 italic">
                      No module data available
                    </td>
                  </tr>
                ) : (
                  analytics.easiestModules.map((m) => (
                    <tr
                      key={m.moduleCode}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3">
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {m.moduleCode}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {m.total}
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-emerald-600">
                        {m.passed}
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-red-500">{m.failed}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${m.passRate}%` }}
                            />
                          </div>
                          <span className="text-aerojet-blue font-black">{m.passRate}%</span>
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