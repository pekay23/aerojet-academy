'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import RevenueChart from './RevenueChart'

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  paymentMethod: string
  referenceType?: string | null
  createdAt: string
  approvedAt?: string | null
  user: {
    email: string
    profile?: { firstName: string; lastName: string } | null
  }
}

interface FinanceData {
  totalRegistration: number
  totalCourse: number
  monthRegistration: number
  monthCourse: number
  lastMonthRegistration: number
  lastMonthCourse: number
  pendingCount: number
  pendingTotal: number
  recentTransactions: Transaction[]
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; style: string }> = {
  APPROVED: { label: 'Approved', icon: CheckCircle2, style: 'text-emerald-600 bg-emerald-50' },
  PENDING: { label: 'Pending', icon: Clock, style: 'text-amber-600 bg-amber-50' },
  REJECTED: { label: 'Rejected', icon: XCircle, style: 'text-red-600 bg-red-50' },
}

export default function FinanceOverview({
  chartData,
}: {
  chartData: { month: string; revenue: number }[]
}) {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/staff/finance/overview')
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const regGrowth = data
    ? data.lastMonthRegistration > 0
      ? ((data.monthRegistration - data.lastMonthRegistration) / data.lastMonthRegistration) * 100
      : 0
    : 0

  const courseGrowth = data
    ? data.lastMonthCourse > 0
      ? ((data.monthCourse - data.lastMonthCourse) / data.lastMonthCourse) * 100
      : 0
    : 0

  const statCards = [
    {
      label: 'Registration Revenue',
      value: `GH₵ ${Number(data?.totalRegistration ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 0 })}`,
      icon: Wallet,
      bg: 'bg-blue-50',
      color: 'text-aerojet-sky',
      sub: data ? `${regGrowth >= 0 ? '+' : ''}${regGrowth.toFixed(1)}% vs last month` : undefined,
    },
    {
      label: 'Course Revenue',
      value: `€ ${Number(data?.totalCourse ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 0 })}`,
      icon: TrendingUp,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
      sub: data
        ? `${courseGrowth >= 0 ? '+' : ''}${courseGrowth.toFixed(1)}% vs last month`
        : undefined,
    },
    {
      label: 'Pending Verification',
      value: String(data?.pendingCount ?? 0),
      icon: Clock,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
      sub: data ? `Approvals queued` : undefined,
      href: '/staff/payments?tab=PENDING',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-aerojet-blue text-2xl font-black tracking-tight uppercase dark:text-white">
            Finance
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Revenue separation: Registration (GHS) vs Training (EUR)
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((s) => {
          const Icon = s.icon
          const card = (
            <div
              className={`flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${s.href ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}
            >
              <div
                className={`h-11 w-11 rounded-xl ${s.bg} flex shrink-0 items-center justify-center`}
              >
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-black text-slate-800 dark:text-slate-200">
                  {loading ? '—' : s.value}
                </p>
                <p className="truncate text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  {s.label}
                </p>
                {s.sub && <p className="mt-0.5 text-[11px] font-bold text-slate-400">{s.sub}</p>}
              </div>
            </div>
          )
          return s.href ? (
            <a key={s.label} href={s.href}>
              {card}
            </a>
          ) : (
            <div key={s.label}>{card}</div>
          )
        })}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black tracking-tight text-slate-800 uppercase dark:text-slate-200">
              Revenue — Last 6 Months
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">Approved payments only</p>
          </div>
          <TrendingUp className="text-aerojet-sky h-5 w-5" />
        </div>
        {chartData.some((d) => d.revenue > 0) ? (
          <RevenueChart data={chartData} currency="GHS " />
        ) : (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm font-bold text-slate-300">No revenue data yet</p>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-sm font-black tracking-tight text-slate-800 uppercase dark:text-slate-200">
            Recent Transactions
          </h2>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                {['User', 'Type', 'Amount', 'Method', 'Status', 'Date'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data?.recentTransactions?.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <p className="text-sm font-bold text-slate-400">No transactions yet</p>
                  </td>
                </tr>
              ) : (
                data.recentTransactions.map((tx) => {
                  const fullName = tx.user.profile
                    ? `${tx.user.profile.firstName} ${tx.user.profile.lastName}`
                    : tx.user.email
                  const cfg = STATUS_CONFIG[tx.status] ?? {
                    label: tx.status,
                    icon: Clock,
                    style: 'text-slate-500 bg-slate-50',
                  }
                  const StatusIcon = cfg.icon
                  return (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-slate-700">{fullName}</p>
                        <p className="text-xs text-slate-400">{tx.user.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                        {tx.referenceType?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td className="text-aerojet-blue dark:text-aerojet-sky px-5 py-3.5 text-sm font-black">
                        {tx.currency}{' '}
                        {Number(tx.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {tx.paymentMethod.replace(/_/g, ' ')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${cfg.style}`}
                        >
                          <StatusIcon className="h-3 w-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block divide-y divide-slate-100 md:hidden dark:divide-slate-800">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            ))
          ) : !data?.recentTransactions?.length ? (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-slate-400">No transactions yet</p>
            </div>
          ) : (
            data.recentTransactions.map((tx) => {
              const fullName = tx.user.profile
                ? `${tx.user.profile.firstName} ${tx.user.profile.lastName}`
                : tx.user.email
              const cfg = STATUS_CONFIG[tx.status] ?? {
                label: tx.status,
                icon: Clock,
                style: 'text-slate-500 bg-slate-50',
              }
              const StatusIcon = cfg.icon
              return (
                <div key={tx.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {fullName}
                      </p>
                      <p className="text-xs text-slate-400">{tx.user.email}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${cfg.style}`}
                    >
                      <StatusIcon className="h-3 w-3" /> {cfg.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Amount</p>
                      <p className="text-aerojet-blue font-black dark:text-blue-400">
                        {tx.currency}{' '}
                        {Number(tx.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Method</p>
                      <p className="font-bold text-slate-600 dark:text-slate-400">
                        {tx.paymentMethod.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Type</p>
                      <p className="font-bold text-slate-600 dark:text-slate-400">
                        {tx.referenceType?.replace(/_/g, ' ') ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Date</p>
                      <p className="font-bold text-slate-600 dark:text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="border-t border-slate-100 px-6 py-3 dark:border-slate-800">
          <a
            href="/staff/finance?tab=transactions"
            className="text-aerojet-sky text-xs font-bold hover:underline"
          >
            View all transactions →
          </a>
        </div>
      </div>
    </div>
  )
}
