'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  CreditCard,
  Target,
  ShieldAlert,
  Percent,
} from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { generateFinancialPDF } from '@/lib/analytics/pdf-export'
import type {
  MonthlyRevenueItem,
  RevenueByProgrammeItem,
  PaymentStatusBreakdownItem,
  PaymentMethodBreakdownItem,
} from '@/lib/types/staff'

interface ReportsPanelProps {
  initialData: {
    summary: FinanceReportSummary
    revenueByType: RevenueByProgrammeItem[]
    paymentMethods: PaymentMethodBreakdownItem[]
    monthlyData: MonthlyRevenueItem[]
    paymentStatus: PaymentStatusBreakdownItem[]
  }
}

type FinanceReportSummary = {
  totalRevenue: number
  revenueThisMonth: number
  revenueThisYear: number
  pendingAmount: number
  pendingCount: number
  avgTransactionValue: number
  totalCount: number
  monthCount: number
  yearCount: number
  rejectedCount: number
  rejectedAmount: number
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const STATUS_ICON: Record<
  string,
  { icon: typeof CheckCircle; color: string; bg: string; bar: string }
> = {
  APPROVED: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    bar: 'bg-emerald-500',
  },
  COMPLETED: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    bar: 'bg-emerald-500',
  },
  PENDING: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    bar: 'bg-amber-500',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    bar: 'bg-red-500',
  },
  FAILED: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    bar: 'bg-red-500',
  },
  PROCESSING: {
    icon: AlertCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    bar: 'bg-blue-500',
  },
}

export default function ReportsPanel({ initialData }: ReportsPanelProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/finance/reports?year=${year}&month=${month}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  const isInitialYear = year === now.getFullYear()
  const isInitialMonth = month === now.getMonth() + 1
  useEffect(() => {
    if (!isInitialYear || !isInitialMonth) {
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData()
    }
  }, [year, month, fetchData, isInitialYear, isInitialMonth])

  const { summary, revenueByType, paymentMethods, monthlyData, paymentStatus } = data
  const maxMonthlyRevenue = Math.max(...monthlyData.map((m: MonthlyRevenueItem) => m.revenue), 1)
  const successRate =
    summary.totalCount + summary.rejectedCount > 0
      ? Math.round((summary.totalCount / (summary.totalCount + summary.rejectedCount)) * 100)
      : 0

  const handleExportCSV = () => {
    window.open(`/api/staff/export?type=finances`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* â”€â”€ Period Selector & Actions â”€â”€ */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="bg-aerojet-blue/10 dark:bg-aerojet-sky/10 flex h-9 w-9 items-center justify-center rounded-xl">
            <Calendar className="text-aerojet-blue dark:text-aerojet-sky h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Reporting Period
            </p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">
              {MONTH_NAMES[month - 1]} {year}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1 py-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-14 px-2 text-center text-sm font-black text-slate-900 dark:text-slate-100">
              {year}
            </span>
            <button
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= now.getFullYear()}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="focus:border-aerojet-blue rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 transition-colors outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setYear(now.getFullYear())
              setMonth(now.getMonth() + 1)
            }}
            className="hover:bg-aerojet-blue dark:hover:bg-aerojet-blue rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold tracking-wide text-slate-600 uppercase transition-colors hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            Current
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              window.open(
                `/api/staff/finance/reports/export?year=${year}&month=${month}&format=html`,
                '_blank'
              )
            }
            className="hover:border-aerojet-blue hover:text-aerojet-blue dark:hover:border-aerojet-sky dark:hover:text-aerojet-sky flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-wide text-slate-700 uppercase shadow-sm transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <FileText className="h-3.5 w-3.5" /> View Report
          </button>
          <button
            onClick={() => generateFinancialPDF(data, year, month)}
            className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold tracking-wide text-indigo-700 uppercase shadow-sm transition-all hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
          >
            <Download className="h-3.5 w-3.5" /> Download PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold tracking-wide text-emerald-700 uppercase shadow-sm transition-all hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          {loading && <Loader2 className="text-aerojet-blue h-4 w-4 animate-spin" />}
        </div>
      </div>

      {/* â”€â”€ Summary KPI Cards â”€â”€ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Year Revenue',
            value: formatCurrency(summary.totalRevenue),
            sub: `${summary.totalCount} transactions in ${year}`,
            icon: DollarSign,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
          },
          {
            label: MONTH_NAMES[month - 1],
            value: formatCurrency(summary.revenueThisMonth),
            sub: `${summary.monthCount} transactions`,
            icon: Calendar,
            iconColor: 'text-aerojet-blue dark:text-aerojet-sky',
            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
          },
          {
            label: `Full Year ${year}`,
            value: formatCurrency(summary.revenueThisYear),
            sub: `${summary.yearCount} approved`,
            icon: TrendingUp,
            iconColor: 'text-violet-600',
            iconBg: 'bg-violet-50 dark:bg-violet-900/20',
          },
          {
            label: 'Pending Payments',
            value: formatCurrency(summary.pendingAmount),
            sub: `${summary.pendingCount} pending`,
            icon: Clock,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-50 dark:bg-amber-900/20',
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-black text-slate-800 dark:text-slate-200">
                  {card.value}
                </p>
                <p className="truncate text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  {card.label}
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-slate-400">{card.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* â”€â”€ Monthly Revenue Chart â”€â”€ */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-slate-800 uppercase dark:text-slate-200">
              Monthly Revenue
            </h3>
            <p className="text-xs text-slate-400">{year} monthly breakdown</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {monthlyData.map((m: MonthlyRevenueItem) => {
            const pct = maxMonthlyRevenue > 0 ? (m.revenue / maxMonthlyRevenue) * 100 : 0
            const isCurrentMonth = m.month === MONTH_NAMES[month - 1]?.slice(0, 3)
            return (
              <div
                key={m.month}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${isCurrentMonth ? 'bg-emerald-50/60 dark:bg-emerald-900/10' : ''}`}
              >
                <span
                  className={`w-10 text-xs font-black uppercase ${isCurrentMonth ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}
                >
                  {m.month}
                </span>
                <div className="flex-1">
                  <div className="h-7 w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`flex h-full items-center rounded-lg transition-all duration-500 ${isCurrentMonth ? 'bg-emerald-500' : 'bg-emerald-400/70'}`}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    >
                      {pct > 15 && (
                        <span className="pl-3 text-[10px] font-black text-white">
                          {formatCurrency(m.revenue)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {pct <= 15 && (
                  <span className="w-24 text-right text-xs font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(m.revenue)}
                  </span>
                )}
                <span className="w-10 text-right text-[10px] font-bold text-slate-400">
                  {m.count} tx
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* â”€â”€ Revenue by Programme & Payment Status â”€â”€ */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Programme */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <PieChart className="text-aerojet-blue dark:text-aerojet-sky h-4 w-4" />
            </div>
            <h3 className="text-sm font-black tracking-tight text-slate-800 uppercase dark:text-slate-200">
              Revenue by Programme
            </h3>
          </div>
          {revenueByType.every((r: RevenueByProgrammeItem) => r.value === 0) ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm font-bold text-slate-300">No revenue data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {revenueByType
                .filter((r: RevenueByProgrammeItem) => r.value > 0)
                .sort((a: RevenueByProgrammeItem, b: RevenueByProgrammeItem) => b.value - a.value)
                .map((item: RevenueByProgrammeItem, idx: number) => {
                  const colors = [
                    'bg-aerojet-blue',
                    'bg-indigo-500',
                    'bg-violet-500',
                    'bg-cyan-500',
                    'bg-emerald-500',
                  ]
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {formatCurrency(item.value)}
                          </span>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${colors[idx % colors.length]} transition-all duration-500`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <Target className="h-4 w-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-black tracking-tight text-slate-800 uppercase dark:text-slate-200">
              Payment Status
            </h3>
          </div>
          <div className="space-y-3">
            {paymentStatus.map((status: PaymentStatusBreakdownItem) => {
              const cfg = STATUS_ICON[status.status] || STATUS_ICON.PROCESSING
              const Icon = cfg.icon
              return (
                <div key={status.status} className={`rounded-xl ${cfg.bg} p-3 transition-colors`}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                      <span className="text-xs font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                        {status.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {formatCurrency(status.amount)}
                      </span>
                      <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                        {status.count} {status.count === 1 ? 'tx' : 'txs'}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/60 dark:bg-slate-800/60">
                    <div
                      className={`h-full rounded-full ${cfg.bar} transition-all duration-500`}
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* â”€â”€ Payment Methods Table â”€â”€ */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
            <CreditCard className="h-4 w-4 text-indigo-600" />
          </div>
          <h3 className="text-sm font-black tracking-tight text-slate-800 uppercase dark:text-slate-200">
            Payment Methods
          </h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="px-6 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Method
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Transactions
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Amount
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Share
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-50 dark:divide-slate-800">
            {paymentMethods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <p className="text-sm font-bold text-slate-300">No payment data available</p>
                </TableCell>
              </TableRow>
            ) : (
              paymentMethods.map((method: PaymentMethodBreakdownItem) => (
                <TableRow
                  key={method.method}
                  className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                >
                  <TableCell className="px-6 py-4">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300">
                      {method.method.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm font-bold text-slate-600 dark:text-slate-400">
                    {method.count}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(method.amount)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${method.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{method.percentage}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* â”€â”€ Bottom Stats Row â”€â”€ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-800 dark:text-slate-200">
              {formatCurrency(summary.avgTransactionValue)}
            </p>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Avg Transaction
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
            <ShieldAlert className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-xl font-black text-red-600">
              {formatCurrency(summary.rejectedAmount)}
            </p>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Rejected / Failed
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-slate-400">
              {summary.rejectedCount} transactions
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <Percent className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-black text-emerald-600">{successRate}%</p>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Success Rate
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-slate-400">of completed transactions</p>
          </div>
        </div>
      </div>
    </div>
  )
}
