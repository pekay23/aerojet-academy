'use client'

import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wallet,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import type { FinanceOverviewData } from '@/lib/finance/overview'
import { useSort, SortHeader } from '@/lib/hooks/useSort'
import { getTransactionStatusStyle, STATUS_LABELS } from '@/lib/utils/status-styles'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
const RevenueChart = dynamic(() => import('./RevenueChart'), { ssr: false })

// Map STATUS_ICONS keys to Lucide components
const STATUS_ICON_COMPONENTS = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  processing: Loader2,
  completed: CheckCircle2,
  failed: AlertCircle,
} as const

function getStatusIcon(statusStyle: string) {
  if (statusStyle.includes('emerald')) return STATUS_ICON_COMPONENTS.approved
  if (statusStyle.includes('amber')) return STATUS_ICON_COMPONENTS.pending
  if (statusStyle.includes('red')) return STATUS_ICON_COMPONENTS.rejected
  if (statusStyle.includes('blue')) return STATUS_ICON_COMPONENTS.processing
  return STATUS_ICON_COMPONENTS.approved
}

export default function FinanceOverview({
  chartData,
  initialData,
}: {
  chartData: { month: string; revenue: number }[]
  initialData: FinanceOverviewData
}) {
  const [data, setData] = useState<FinanceOverviewData | null>(initialData)
  const [loading, setLoading] = useState(false)

  const sortableTransactions = useMemo(
    () =>
      (data?.recentTransactions ?? []).map((tx) => ({
        ...tx,
        _userSort: tx.user.profile
          ? `${tx.user.profile.firstName} ${tx.user.profile.lastName}`.toLowerCase()
          : tx.user.email.toLowerCase(),
      })),
    [data]
  )
  const { items: sortedTransactions, requestSort, sortConfig } = useSort(sortableTransactions)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/staff/finance/overview')
      if (!res.ok) return
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

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
      label: 'Total Revenue',
      value: formatCurrency(data?.totalRevenue ?? 0, 'EUR'),
      icon: TrendingUp,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
      sub: data ? `${data.totalRevenueCount} approved payments` : undefined,
    },
    {
      label: 'Registration Revenue',
      value: formatCurrency(data?.totalRegistration ?? 0, 'GHS'),
      icon: Wallet,
      bg: 'bg-blue-50',
      color: 'text-aerojet-sky',
      sub: data ? `${regGrowth >= 0 ? '+' : ''}${regGrowth.toFixed(1)}% vs last month` : undefined,
      growthPositive: regGrowth >= 0,
    },
    {
      label: 'Course Revenue',
      value: formatCurrency(data?.totalCourse ?? 0, 'EUR'),
      icon: Wallet,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
      sub: data
        ? `${courseGrowth >= 0 ? '+' : ''}${courseGrowth.toFixed(1)}% vs last month`
        : undefined,
      growthPositive: courseGrowth >= 0,
    },
    {
      label: 'Pending Verification',
      value: String(data?.pendingCount ?? 0),
      icon: Clock,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
      sub: data ? `Pending total: ${formatCurrency(data.pendingTotal ?? 0, 'EUR')}` : undefined,
      href: '/staff/payments?tab=PENDING',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                {s.sub && (
                  <p
                    className={`mt-0.5 text-[11px] font-bold ${
                      'growthPositive' in s
                        ? s.growthPositive
                          ? 'text-emerald-600'
                          : 'text-red-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.sub}
                  </p>
                )}
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
              Revenue - Last 6 Months
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">Approved payments in EUR</p>
          </div>
          <TrendingUp className="text-aerojet-sky h-5 w-5" />
        </div>
        {chartData.some((d) => d.revenue > 0) ? (
          <RevenueChart data={chartData} currency="EUR " />
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
                <SortHeader label="User" sortKey="_userSort" currentSort={sortConfig} onSort={requestSort} className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase" />
                <SortHeader label="Type" sortKey="referenceType" currentSort={sortConfig} onSort={requestSort} className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase" />
                <SortHeader label="Amount" sortKey="amount" currentSort={sortConfig} onSort={requestSort} align="right" className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase" />
                <SortHeader label="Method" sortKey="paymentMethod" currentSort={sortConfig} onSort={requestSort} className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase" />
                <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={requestSort} align="center" className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase" />
                <SortHeader label="Date" sortKey="createdAt" currentSort={sortConfig} onSort={requestSort} align="right" className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase" />
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
              ) : !sortedTransactions.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <p className="text-sm font-bold text-slate-400">No transactions yet</p>
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => {
                  const fullName = tx.user.profile
                    ? [
                        tx.user.profile.firstName,
                        tx.user.profile.middleName,
                        tx.user.profile.lastName,
                      ]
                        .filter(Boolean)
                        .join(' ')
                    : tx.user.email
                  const statusStyle = getTransactionStatusStyle(tx.status)
                  const statusLabel = STATUS_LABELS[tx.status] ?? tx.status
                  const StatusIcon = getStatusIcon(statusStyle)
                  return (
                    <tr
                      key={tx.id}
                      className="transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-slate-700">{fullName}</p>
                        <p className="text-xs text-slate-400">{tx.user.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                        {tx.referenceType?.replace(/_/g, ' ') ?? '-'}
                      </td>
                      <td className="text-aerojet-blue dark:text-aerojet-sky px-5 py-3.5 text-sm font-black">
                        {formatCurrency(tx.amount, tx.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {tx.paymentMethod.replace(/_/g, ' ')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${statusStyle}`}
                        >
                          <StatusIcon className="h-3 w-3" /> {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(tx.createdAt, 'SHORT')}
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
                ? [tx.user.profile.firstName, tx.user.profile.middleName, tx.user.profile.lastName]
                    .filter(Boolean)
                    .join(' ')
                : tx.user.email
              const statusStyle = getTransactionStatusStyle(tx.status)
              const statusLabel = STATUS_LABELS[tx.status] ?? tx.status
              const StatusIcon = getStatusIcon(statusStyle)
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
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${statusStyle}`}
                    >
                      <StatusIcon className="h-3 w-3" /> {statusLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Amount</p>
                      <p className="text-aerojet-blue font-black dark:text-blue-400">
                        {formatCurrency(tx.amount, tx.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Method</p>
                      <p className="font-bold text-slate-600 dark:text-slate-400">
                        {tx.paymentMethod?.replace(/_/g, ' ') ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Type</p>
                      <p className="font-bold text-slate-600 dark:text-slate-400">
                        {tx.referenceType?.replace(/_/g, ' ') ?? '-'}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Date</p>
                      <p className="font-bold text-slate-600 dark:text-slate-400">
                        {formatDate(tx.createdAt, 'SHORT')}
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
