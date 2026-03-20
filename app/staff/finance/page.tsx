import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import FinanceTabs from '../_components/FinanceTabs'
import FinanceOverview from '../_components/FinanceOverview'
import ReconciliationQueue from '../_components/ReconciliationQueue'
import PendingTopupsTable from '../_components/PendingTopupsTable'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import Link from 'next/link'
import SearchInput from '@/components/SearchInput'
import { getCurrencySymbol } from '@/lib/currency'
import { TopupActions } from './wallet-topups/_components/TopupActions'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import {
  getFinanceReportSummary,
  getRevenueByProgrammeType,
  getPaymentMethodBreakdown,
  getMonthlyRevenueData,
  getPaymentStatusBreakdown,
} from '@/lib/analytics/reports'
import { formatCurrency } from '@/lib/analytics/metrics'

export const metadata: Metadata = { title: 'Finance | Staff Portal' }
export const dynamic = 'force-dynamic'

const VALID_TABS = ['overview', 'transactions', 'wallet-topups', 'reconciliation', 'reports']

async function getOverviewChartData() {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const payments = await prisma.payment.findMany({
    where: { status: 'APPROVED', approvedAt: { gte: sixMonthsAgo } },
    select: { amount: true, approvedAt: true },
  })

  const map: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    map[`${monthNames[d.getMonth()]} ${d.getFullYear()}`] = 0
  }
  for (const p of payments) {
    if (!p.approvedAt) continue
    const d = new Date(p.approvedAt)
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    // p.amount is now standardized to EUR for all new payments
    if (key in map) map[key] += Number(p.amount)
  }
  return Object.entries(map).map(([k, revenue]) => ({ month: k.split(' ')[0], revenue }))
}

async function getWalletTopupsData() {
  const pendingRequests = await prisma.payment.findMany({
    where: { referenceType: 'WALLET_TOPUP', status: 'PENDING' },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const topupHistory = await prisma.walletTransaction.findMany({
    where: { type: 'TOP_UP' },
    orderBy: { createdAt: 'desc' },
    include: { wallet: { include: { user: { include: { profile: true } } } } },
    take: 50,
  })

  return { pendingRequests, topupHistory }
}

async function getTransactionsData(query?: string) {
  const settings = await prisma.systemSetting.findMany({ where: { key: 'course_currency' } })
  const currency = settings[0]?.value || 'EUR'
  const symbol = getCurrencySymbol(currency)

  const transactions = await prisma.walletTransaction.findMany({
    where: query
      ? {
          OR: [
            { wallet: { user: { OR: [
              { email: { contains: query, mode: 'insensitive' } },
              { profile: { firstName: { contains: query, mode: 'insensitive' } } },
              { profile: { lastName: { contains: query, mode: 'insensitive' } } },
            ] } } },
            { referenceId: { contains: query, mode: 'insensitive' } },
            { referenceType: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    include: { wallet: { include: { user: { include: { profile: true } } } } },
    take: 100,
  })

  const serialized = transactions.map((tx) => ({
    ...tx,
    amount: Number(tx.amount),
    balanceBefore: tx.balanceBefore ? Number(tx.balanceBefore) : null,
    balanceAfter: tx.balanceAfter ? Number(tx.balanceAfter) : null,
    reservedBefore: tx.reservedBefore ? Number(tx.reservedBefore) : null,
    reservedAfter: tx.reservedAfter ? Number(tx.reservedAfter) : null,
    availableBefore: tx.availableBefore ? Number(tx.availableBefore) : null,
    availableAfter: tx.availableAfter ? Number(tx.availableAfter) : null,
  }))

  const paymentIds = serialized
    .filter((tx) => tx.referenceType === 'PAYMENT_ID' && tx.referenceId)
    .map((tx) => tx.referenceId!)

  const relatedPayments = await prisma.payment.findMany({
    where: { id: { in: paymentIds } },
    select: {
      id: true,
      reconciled: true,
      paymentCurrency: true,
      originalAmount: true,
    },
  })

  const paymentDataMap = new Map(
    relatedPayments.map((p) => [
      p.id,
      {
        reconciled: p.reconciled,
        originalCurrency: p.paymentCurrency,
        originalAmount: p.originalAmount ? Number(p.originalAmount) : null,
      },
    ])
  )

  return { serialized, symbol, paymentDataMap }
}

async function getReportsData() {
  const [summary, revenueByType, paymentMethods, monthlyData, paymentStatus] = await Promise.all([
    getFinanceReportSummary(),
    getRevenueByProgrammeType(),
    getPaymentMethodBreakdown(),
    getMonthlyRevenueData(),
    getPaymentStatusBreakdown(),
  ])
  return { summary, revenueByType, paymentMethods, monthlyData, paymentStatus }
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; query?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const params = await searchParams
  const tab = VALID_TABS.includes(params.tab ?? '') ? params.tab! : 'overview'

  const pendingTopupCount = await prisma.payment.count({
    where: { referenceType: 'WALLET_TOPUP', status: 'PENDING' },
  })

  return (
    <FinanceTabs pendingTopupCount={pendingTopupCount}>
      {tab === 'overview' && <OverviewTab />}
      {tab === 'transactions' && <TransactionsTab query={params.query} />}
      {tab === 'wallet-topups' && <WalletTopupsTab />}
      {tab === 'reconciliation' && <ReconciliationTab />}
      {tab === 'reports' && <ReportsTab />}
    </FinanceTabs>
  )
}

/* ─── Overview Tab ─── */
async function OverviewTab() {
  const chartData = await getOverviewChartData()
  return <FinanceOverview chartData={chartData} />
}

/* ─── Wallet Top-ups Tab ─── */
async function WalletTopupsTab() {
  const { pendingRequests, topupHistory } = await getWalletTopupsData()

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <Clock className="h-5 w-5 text-amber-500" />
          Awaiting Verification ({pendingRequests.length})
        </h2>

        <PendingTopupsTable requests={pendingRequests as any} />
      </div>

      <div className="space-y-4">
        <h2 className="mt-8 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          Recent Top-ups History
        </h2>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Amount Credited</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Approved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topupHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    No top-ups found.
                  </TableCell>
                </TableRow>
              ) : (
                topupHistory.map((tx) => {
                  const user = tx.wallet.user
                  const userName = user.profile
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user.email

                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {userName}
                          </span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{tx.wallet.currency} {Number(tx.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-slate-50 text-slate-600 dark:bg-slate-800"
                        >
                          {tx.referenceType || 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

/* ─── Transactions Tab ─── */
async function TransactionsTab({ query }: { query?: string }) {
  const { serialized, symbol, paymentDataMap } = await getTransactionsData(query)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TOP_UP':
      case 'REFUND':
      case 'RELEASE':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
      case 'CAPTURE':
      case 'PAYMENT':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
      case 'RESERVE':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="w-72">
          <SearchInput placeholder="Search user or reference..." />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                User
              </TableHead>
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Type
              </TableHead>
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Amount
              </TableHead>
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Reference & Status
              </TableHead>
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {serialized.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center font-bold text-slate-500 dark:text-slate-400"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              serialized.map((tx) => {
                const user = tx.wallet.user
                const userName = user.profile
                  ? `${user.profile.firstName} ${user.profile.lastName}`
                  : user.email

                const paymentData =
                  tx.referenceType === 'PAYMENT_ID' ? paymentDataMap.get(tx.referenceId!) : null
                const isReconciled = paymentData?.reconciled

                return (
                  <TableRow
                    key={tx.id}
                    className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {userName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <Badge
                        className={`${getTypeColor(tx.type)} rounded-lg border-none px-2 py-0.5 text-[10px] font-black tracking-widest uppercase transition-all`}
                        variant="secondary"
                      >
                        {tx.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-black ${
                            ['TOP_UP', 'REFUND', 'RELEASE'].includes(tx.type)
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {['TOP_UP', 'REFUND', 'RELEASE'].includes(tx.type) ? '+' : '-'}
                          {symbol}
                          {tx.amount.toFixed(2)}
                        </span>
                        {paymentData?.originalCurrency &&
                          paymentData.originalCurrency !== symbol && (
                            <span className="text-[10px] font-medium text-slate-400">
                              ({paymentData.originalCurrency}{' '}
                              {paymentData.originalAmount?.toFixed(2)})
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {tx.referenceType || '—'}
                          </span>
                          {isReconciled ? (
                            <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                              Reconciled
                            </span>
                          ) : tx.referenceType === 'PAYMENT_ID' ? (
                            <span className="flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-400 dark:bg-slate-800">
                              Pending Settlement
                            </span>
                          ) : null}
                        </div>
                        {tx.referenceId && (
                          <span className="font-mono text-[10px] text-slate-400">
                            {tx.referenceId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-xs text-slate-500">
                      {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/* ─── Reconciliation Tab ─── */
function ReconciliationTab() {
  return <ReconciliationQueue />
}

/* ─── Reports Tab ─── */
async function ReportsTab() {
  const { summary, revenueByType, paymentMethods, monthlyData, paymentStatus } =
    await getReportsData()

  const maxMonthlyRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1)

  return (
    <div className="space-y-6">
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
                      style={{ width: `${(month.revenue / maxMonthlyRevenue) * 100}%` }}
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
