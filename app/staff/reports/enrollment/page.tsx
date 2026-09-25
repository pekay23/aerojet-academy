import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import Link from 'next/link'
import { getAuthSession } from '@/lib/auth/helpers'
import React from 'react'
import { TrendingUp, Users, Award } from 'lucide-react'
import { getEnrollmentTrends } from '@/lib/analytics/reports'
import { EnrollmentChart } from '../_components/ReportCharts'
import MetricCard from '../_components/MetricCard'

export const metadata: Metadata = { title: 'Enrollment Trends | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function EnrollmentPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const data = await getEnrollmentTrends()

  const totalEnrollments = data.reduce((sum, item) => sum + item.count, 0)
  const averagePerCourse = data.length > 0 ? Math.round(totalEnrollments / data.length) : 0
  const topCourse = data[0]

  return (
    <div className="mx-auto max-w-480 space-y-8">
      <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight sm:text-4xl dark:text-white">
            Enrollment Trends
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time breakdown of module enrollments.
          </p>
        </div>
        <Link
          href="/staff/reports"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
        >
          ← All Reports
        </Link>
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
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <h3 className="text-aerojet-blue text-lg font-black dark:text-white">
              Enrollment Trend
            </h3>
            <p className="text-sm font-medium text-slate-400">Enrollments over time</p>
          </div>
          <EnrollmentChart data={data} />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-50 bg-slate-50/30 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
            <h3 className="text-aerojet-blue text-sm font-black tracking-widest uppercase dark:text-slate-100">
              Module Enrollment Detail
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Module enrollment details showing course code, name, and total enrollments
              </caption>
              <thead className="bg-slate-50/50 text-[11px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
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
                      <td className="text-aerojet-blue px-6 py-4 font-black dark:text-slate-100">
                        {item.courseName}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-aerojet-blue text-xl font-black dark:text-slate-100">
                            {item.count}
                          </span>
                          <div className="h-2 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full bg-blue-500"
                              style={{
                                width: `${Math.min((item.count / (topCourse?.count || 1)) * 100, 100)}%`,
                              }}
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
