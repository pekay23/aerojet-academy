import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import {
  getFinanceReportSummary,
  getRevenueByProgrammeType,
  getPaymentMethodBreakdown,
  getMonthlyRevenueData,
  getPaymentStatusBreakdown,
} from '@/lib/analytics/reports'
import { formatCurrency } from '@/lib/analytics/metrics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Financial Reports | Staff Portal' }

export default async function FinanceReportsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  // Fetch all report data in parallel
  const [summary, revenueByType, paymentMethods, monthlyData, paymentStatus] = await Promise.all([
    getFinanceReportSummary(),
    getRevenueByProgrammeType(),
    getPaymentMethodBreakdown(),
    getMonthlyRevenueData(),
    getPaymentStatusBreakdown(),
  ])

  const maxMonthlyRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
            Financial Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Comprehensive financial analytics and revenue insights
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-muted-foreground text-xs">{summary.totalCount} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.revenueThisMonth)}</div>
            <p className="text-muted-foreground text-xs">{summary.monthCount} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Year</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.revenueThisYear)}</div>
            <p className="text-muted-foreground text-xs">{summary.yearCount} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.pendingAmount)}</div>
            <p className="text-muted-foreground text-xs">{summary.pendingCount} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {monthlyData.map((month) => (
              <div key={month.month} className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium text-slate-600 dark:text-slate-400">
                  {month.month}
                </span>
                <div className="flex-1">
                  <div className="h-6 w-full overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded bg-emerald-500 transition-all"
                      style={{
                        width: `${(month.revenue / maxMonthlyRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-28 text-right text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(month.revenue)}
                </span>
                <span className="w-12 text-right text-xs text-slate-500">{month.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout: Revenue by Type & Payment Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Programme Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Programme Type</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByType.every((r) => r.value === 0) ? (
              <p className="text-muted-foreground py-8 text-center">No revenue data available</p>
            ) : (
              <div className="space-y-4">
                {revenueByType
                  .filter((r) => r.value > 0)
                  .sort((a, b) => b.value - a.value)
                  .map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm font-bold">{formatCurrency(item.value)}</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-[#002a5c] dark:bg-blue-400"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right text-xs text-slate-500">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentStatus.map((status) => (
                <div key={status.status} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {status.status === 'APPROVED' && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                        {status.status === 'PENDING' && (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                        {status.status === 'REJECTED' && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {status.status === 'FAILED' && <XCircle className="h-4 w-4 text-red-500" />}
                        {status.status === 'PROCESSING' && (
                          <AlertCircle className="h-4 w-4 text-blue-500" />
                        )}
                        {status.status === 'COMPLETED' && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                        <span className="text-sm font-medium">{status.status}</span>
                      </div>
                      <span className="text-sm font-bold">{formatCurrency(status.amount)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            status.status === 'APPROVED'
                              ? 'bg-emerald-500'
                              : status.status === 'PENDING'
                                ? 'bg-amber-500'
                                : status.status === 'REJECTED' || status.status === 'FAILED'
                                  ? 'bg-red-500'
                                  : 'bg-blue-500'
                          }`}
                          style={{ width: `${status.percentage}%` }}
                        />
                      </div>
                      <span className="ml-3 w-16 text-right text-xs text-slate-500">
                        {status.count} {status.count === 1 ? 'tx' : 'txs'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                    No payment data available
                  </TableCell>
                </TableRow>
              ) : (
                paymentMethods.map((method) => (
                  <TableRow key={method.method}>
                    <TableCell className="font-medium">
                      <Badge variant="secondary" className="uppercase">
                        {method.method.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{method.count}</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(method.amount)}
                    </TableCell>
                    <TableCell className="text-right">{method.percentage}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.avgTransactionValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected/Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.rejectedAmount)}
            </div>
            <p className="text-muted-foreground text-xs">{summary.rejectedCount} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {summary.totalCount + summary.rejectedCount > 0
                ? Math.round(
                    (summary.totalCount / (summary.totalCount + summary.rejectedCount)) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-muted-foreground text-xs">of completed transactions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
