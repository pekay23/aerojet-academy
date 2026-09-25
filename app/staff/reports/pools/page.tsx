import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import Link from 'next/link'
import { getAuthSession } from '@/lib/auth/helpers'
import React from 'react'
import { Calendar, TrendingUp, Users } from 'lucide-react'
import { format } from 'date-fns'
import { getPoolAnalytics } from '@/lib/analytics/reports'
import { PoolFillChart } from '../_components/ReportCharts'
import MetricCard from '../_components/MetricCard'

export const metadata: Metadata = { title: 'Booking Analytics | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function PoolsPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const { pools, chartData } = await getPoolAnalytics()

  const activePools = pools.length
  const totalCapacity = pools.reduce((sum, p) => sum + p.maxCandidates, 0)
  const totalMembers = pools.reduce((sum, p) => sum + p.currentMemberCount, 0)
  const avgUtilization = totalCapacity > 0 ? Math.round((totalMembers / totalCapacity) * 100) : 0
  const pendingSeats = totalCapacity - totalMembers

  return (
    <div className="mx-auto max-w-480 space-y-8">
      <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight sm:text-4xl dark:text-white">
            Booking Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Exam booking performance and capacity utilization.
          </p>
        </div>
        <Link
          href="/staff/reports"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
        >
          ← All Reports
        </Link>
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
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <h3 className="text-aerojet-blue text-lg font-black dark:text-white">
              Capacity Timeline
            </h3>
            <p className="text-sm font-medium text-slate-400">Fill rate percentage per pool</p>
          </div>
          <PoolFillChart data={chartData} />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
            <h3 className="text-aerojet-blue text-sm font-black tracking-widest uppercase dark:text-slate-100">
              Exam Booking Detailed Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Exam booking pool details showing name, event, exam date, status, and utilization
              </caption>
              <thead className="bg-slate-50/50 text-[11px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
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
                        <td className="text-aerojet-blue px-6 py-4 text-base font-black dark:text-white">
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
                            className={`rounded-lg px-2 py-0.5 text-[11px] font-black uppercase ${
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
                              <span className="text-aerojet-blue text-lg font-black dark:text-slate-100">
                                {pool.currentMemberCount}
                              </span>
                              <span className="text-xs font-bold text-slate-400">
                                / {pool.maxCandidates}
                              </span>
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
