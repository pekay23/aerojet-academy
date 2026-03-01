import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { DollarSign } from 'lucide-react'
import { Metadata } from 'next'
import { format } from 'date-fns'
import { getRevenueReport } from '@/lib/analytics/reports'
import { formatCurrency } from '@/lib/analytics/metrics'
import { RevenueChart } from '@/components/charts/RevenueChart'

export const metadata: Metadata = { title: 'Revenue Report | Staff Reports' }

export default async function RevenueReportPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

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
            <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
              Revenue Report
            </h1>
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
