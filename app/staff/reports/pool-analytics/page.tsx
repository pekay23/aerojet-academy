import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { Metadata } from 'next'
import { format } from 'date-fns'
import { getPoolAnalytics } from '@/lib/analytics/reports'
import { PoolFillChart } from '@/components/charts/PoolFillChart'

export const metadata: Metadata = { title: 'Pool Analytics | Staff Reports' }

export default async function PoolAnalyticsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { pools, chartData } = await getPoolAnalytics()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Pool Analytics</h1>
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

