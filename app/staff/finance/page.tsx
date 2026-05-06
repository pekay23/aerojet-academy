import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import { getSystemSetting } from '@/lib/settings'
import { PaymentStatus, TransactionType } from '@/types/enums'
import FinanceTabs from '../_components/FinanceTabs'
import FinanceOverview from '../_components/FinanceOverview'
import ReconciliationQueue from '../_components/ReconciliationQueue'
import PendingTopupsTable from '../_components/PendingTopupsTable'
import TransactionsTable from '../_components/TransactionsTable'
import ReportsPanel from '../_components/ReportsPanel'
import { getFinanceOverviewData } from '@/lib/finance/overview'
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

  const payments = await prismaUnfiltered.payment.findMany({
    where: { status: PaymentStatus.APPROVED, approvedAt: { gte: sixMonthsAgo } },
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
  const pendingRequests = await prismaUnfiltered.payment.findMany({
    where: { referenceType: 'WALLET_TOPUP', status: PaymentStatus.PENDING },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const topupHistory = await prismaUnfiltered.walletTransaction.findMany({
    where: { type: TransactionType.TOP_UP },
    orderBy: { createdAt: 'desc' },
    include: { wallet: { include: { user: { include: { profile: true } } } } },
    take: 50,
  })

  return {
    pendingRequests: serializePrisma(pendingRequests),
    topupHistory: serializePrisma(topupHistory),
  }
}

async function getTransactionsData(query?: string) {
  const currency = await getSystemSetting('course_currency', 'EUR')
  const symbol = getCurrencySymbol(currency)

  const whereClause = query
    ? {
        OR: [
          { wallet: { user: { OR: [
            { email: { contains: query, mode: 'insensitive' as const } },
            { profile: { firstName: { contains: query, mode: 'insensitive' as const } } },
            { profile: { lastName: { contains: query, mode: 'insensitive' as const } } },
          ] } } },
          { referenceId: { contains: query, mode: 'insensitive' as const } },
          { referenceType: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : undefined

  const [transactions, total] = await Promise.all([
    prismaUnfiltered.walletTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { wallet: { include: { user: { include: { profile: true } } } } },
      take: 25,
    }),
    prismaUnfiltered.walletTransaction.count({ where: whereClause }),
  ])

  const serialized = serializePrisma(transactions)
  const transactionIds = serialized.map((tx: any) => tx.id)
  
  const paymentIds = serialized
    .filter((tx: any) => tx.referenceType === 'PAYMENT_ID' && tx.referenceId)
    .map((tx: any) => tx.referenceId!)
  const examBookingReferenceIds = serialized
    .filter((tx: any) => tx.referenceType === 'EXAM_BOOKING' && tx.referenceId)
    .map((tx: any) => tx.referenceId!)
  const fullTimeEnrollmentIds = serialized
    .filter((tx: any) => tx.referenceType === 'FULL_TIME_ENROLLMENT' && tx.referenceId)
    .map((tx: any) => tx.referenceId!)

  const [relatedPayments, relatedExamBookings, relatedFullTimeEnrollments, relatedModularEnrollments, relatedMilestones] =
    await Promise.all([
      paymentIds.length > 0
        ? prismaUnfiltered.payment.findMany({
            where: { id: { in: paymentIds } },
            select: { id: true, reconciled: true, paymentCurrency: true, originalAmount: true, status: true },
          })
        : Promise.resolve([]),
      transactionIds.length > 0 || examBookingReferenceIds.length > 0
        ? prismaUnfiltered.examBooking.findMany({
            where: {
              OR: [
                { id: { in: examBookingReferenceIds } },
                { walletTxnId: { in: transactionIds } },
              ],
            },
            select: { id: true, walletTxnId: true, status: true, demandStatus: true, result: true, moduleCode: true },
          })
        : Promise.resolve([]),
      fullTimeEnrollmentIds.length > 0
        ? prismaUnfiltered.fullTimeEnrollment.findMany({
            where: { id: { in: fullTimeEnrollmentIds } },
            select: { id: true, status: true },
          })
        : Promise.resolve([]),
      transactionIds.length > 0
        ? prismaUnfiltered.modularEnrollment.findMany({
            where: { walletTxnId: { in: transactionIds } },
            select: { id: true, walletTxnId: true, status: true },
          })
        : Promise.resolve([]),
      transactionIds.length > 0
        ? prismaUnfiltered.paymentMilestone.findMany({
            where: { walletTxnId: { in: transactionIds } },
            select: { id: true, walletTxnId: true, milestoneType: true, status: true },
          })
        : Promise.resolve([]),
    ])

  return {
    serialized,
    total,
    symbol,
    related: {
      payments: serializePrisma(relatedPayments),
      examBookings: serializePrisma(relatedExamBookings),
      fullTimeEnrollments: serializePrisma(relatedFullTimeEnrollments),
      modularEnrollments: serializePrisma(relatedModularEnrollments),
      milestones: serializePrisma(relatedMilestones),
    },
  }
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

  const pendingTopupCount = await prismaUnfiltered.payment.count({
    where: { referenceType: 'WALLET_TOPUP', status: PaymentStatus.PENDING },
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
  const [chartData, overviewData] = await Promise.all([
    getOverviewChartData(),
    getFinanceOverviewData(),
  ])
  return <FinanceOverview chartData={chartData} initialData={overviewData} />
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
        <PendingTopupsTable requests={pendingRequests} />
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
                topupHistory.map((tx: any) => {
                  const user = tx.wallet.user
                  const userName = user.profile
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user.email
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{userName}</span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{tx.wallet.currency} {Number(tx.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 dark:bg-slate-800">
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
  const { serialized, total, symbol, related } = await getTransactionsData(query)

  return (
    <TransactionsTable
      currencySymbol={symbol}
      initialData={serialized}
      initialTotal={total}
      initialRelated={related}
      query={query}
    />
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

  return (
    <ReportsPanel
      initialData={{ summary, revenueByType, paymentMethods, monthlyData, paymentStatus }}
    />
  )
}
