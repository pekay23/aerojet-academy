'use client'

import { useState, useEffect, useCallback, Fragment, useMemo } from 'react'
import {
  Search,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import { PaymentStatus } from '@/types/enums'
import { useSort, SortHeader } from '@/lib/hooks/useSort'
import { getPaymentStatusStyle } from '@/lib/utils/status-styles'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import type { PaymentRow } from '@/lib/types/staff'

interface FileUpload {
  id: string
  url: string
  filename: string
  createdAt: string
}

// Use shared PaymentRow type from lib/types/staff.ts
type Payment = PaymentRow

const TABS = [
  { key: PaymentStatus.PENDING, label: 'Pending', color: 'text-amber-600' },
  { key: PaymentStatus.APPROVED, label: 'Approved', color: 'text-emerald-600' },
  { key: PaymentStatus.REJECTED, label: 'Rejected', color: 'text-red-600' },
]

export default function PaymentsQueue({
  initialPendingCount,
  initialTab = PaymentStatus.PENDING,
}: {
  initialPendingCount: number
  initialTab?: string
}) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [uploadHistory, setUploadHistory] = useState<FileUpload[]>([])

  const sortablePayments = useMemo(
    () =>
      payments.map((p) => ({
        ...p,
        _userSort: p.user.profile
          ? `${p.user.profile.firstName} ${p.user.profile.lastName}`.toLowerCase()
          : p.user.email.toLowerCase(),
        _amount: Number(p.amount),
      })),
    [payments]
  )
  const { items: sortedPayments, requestSort, sortConfig } = useSort(sortablePayments)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: tab, ...(search && { search }) })
      const res = await fetch(`/api/staff/payments?${params}`)
      const data = await res.json()
      setPayments(data.payments ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [tab, search])

  useEffect(() => {
    const t = setTimeout(fetchPayments, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [fetchPayments, search])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/staff/payments/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Payment approved')
      setPayments((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error('Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error('Reason required')
      return
    }
    setActionLoading(rejectTarget)
    try {
      const res = await fetch(`/api/staff/payments/${rejectTarget}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason }),
      })
      if (!res.ok) throw new Error()
      toast.success('Payment rejected')
      setPayments((prev) => prev.filter((p) => p.id !== rejectTarget))
    } catch {
      toast.error('Failed to reject')
    } finally {
      setActionLoading(null)
      setRejectTarget(null)
      setRejectReason('')
    }
  }

  const handleOpenHistory = async (id: string) => {
    setHistoryTargetId(id)
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/staff/payments/uploads/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUploadHistory(data.uploads || [])
    } catch {
      toast.error('Failed to load history')
      setUploadHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-aerojet-blue text-2xl font-black tracking-tight uppercase dark:text-white">
            Payments
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {initialPendingCount > 0
              ? `${initialPendingCount} payment${initialPendingCount > 1 ? 's' : ''} awaiting approval`
              : 'All payments up to date'}
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center dark:border-slate-800">
          <div
            role="tablist"
            className="relative flex gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner ring-1 ring-black/5 dark:bg-slate-800/80 dark:ring-white/5"
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                aria-controls={`panel-${t.key}`}
                onClick={() => setTab(t.key)}
                className={`relative rounded-full px-4 py-1.5 text-xs font-bold transition-colors duration-150 ${
                  tab === t.key
                    ? 'text-aerojet-blue dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab === t.key && (
                  <div
                    className="absolute inset-0 bg-white shadow-md ring-1 ring-black/5 transition-all duration-300 ease-out dark:bg-slate-700 dark:ring-white/10"
                    style={{ borderRadius: 9999, zIndex: 0 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-60">
            <label htmlFor="payment-search" className="sr-only">
              Search payments by user or reference
            </label>
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="payment-search"
              name="payment-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user or ref..."
              autoComplete="off"
              className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-xs outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800/50"
            />
          </div>
        </div>

        {/* Table */}
        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <SortHeader
                  label="User"
                  sortKey="_userSort"
                  currentSort={sortConfig}
                  onSort={requestSort}
                  className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase"
                />
                <SortHeader
                  label="Type"
                  sortKey="referenceType"
                  currentSort={sortConfig}
                  onSort={requestSort}
                  className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase"
                />
                <SortHeader
                  label="Amount"
                  sortKey="_amount"
                  currentSort={sortConfig}
                  onSort={requestSort}
                  align="right"
                  className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase"
                />
                <SortHeader
                  label="Method"
                  sortKey="paymentMethod"
                  currentSort={sortConfig}
                  onSort={requestSort}
                  className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase"
                />
                <SortHeader
                  label="Status"
                  sortKey="status"
                  currentSort={sortConfig}
                  onSort={requestSort}
                  align="center"
                  className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase"
                />
                <th className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  Proof
                </th>
                <th className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  {tab === 'PENDING' ? 'Actions' : 'Date'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <CreditCard className="mx-auto mb-2 h-10 w-10 text-slate-200" />
                    <p className="text-sm font-bold text-slate-400">
                      No {tab.toLowerCase()} payments
                    </p>
                  </td>
                </tr>
              ) : (
                sortedPayments.map((p) => {
                  const fullName = p.user.profile
                    ? `${p.user.profile.firstName} ${p.user.profile.lastName}`
                    : p.user.email
                  const isActioning = actionLoading === p.id
                  const isRejecting = rejectTarget === p.id

                  return (
                    <Fragment key={p.id}>
                      <tr
                        key={p.id}
                        className="transition-all duration-150 ease-out hover:bg-white/80 hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:hover:bg-slate-800/60"
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-bold text-slate-700">{fullName}</p>
                          <p className="text-xs text-slate-400">{p.user.email}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                          {p.referenceType?.replace(/_/g, ' ') ?? '—'}
                        </td>
                        <td className="text-aerojet-blue px-5 py-3.5 text-sm font-black">
                          {formatCurrency(p.amount, p.currency)}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                          {p.paymentMethod?.replace(/_/g, ' ') ?? '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${getPaymentStatusStyle(p.status as PaymentStatus)}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {p.proofUrl ? (
                            <div className="flex flex-col items-start gap-1">
                              <a
                                href={p.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-aerojet-sky hover:bg-aerojet-sky/10 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold transition-all duration-150 ease-out hover:shadow-sm"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> Latest
                              </a>
                              <button
                                onClick={() => handleOpenHistory(p.id)}
                                className="text-[10px] font-medium text-slate-400 hover:text-slate-600 hover:underline dark:hover:text-slate-200"
                              >
                                View History
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {tab === PaymentStatus.PENDING ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleApprove(p.id)}
                                disabled={isActioning}
                                className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[10px] font-black text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                              >
                                {isActioning && !isRejecting ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectTarget(isRejecting ? null : p.id)}
                                disabled={isActioning}
                                className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-black text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(p.createdAt, 'SHORT')}
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Inline reject form */}
                      {isRejecting && (
                        <tr key={`reject-${p.id}`} className="bg-red-50">
                          <td colSpan={7} className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <label htmlFor={`reject-reason-${p.id}`} className="sr-only">
                                Reason for rejection
                              </label>
                              <input
                                id={`reject-reason-${p.id}`}
                                name={`reject-reason-${p.id}`}
                                autoFocus
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                autoComplete="off"
                                className="flex-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300 dark:bg-slate-900"
                              />
                              <button
                                onClick={handleReject}
                                disabled={!!actionLoading}
                                className="rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white hover:bg-red-600 disabled:opacity-50"
                              >
                                {actionLoading === p.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Confirm'
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setRejectTarget(null)
                                  setRejectReason('')
                                }}
                                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
          ) : payments.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto mb-2 h-10 w-10 text-slate-200" />
              <p className="text-sm font-bold text-slate-400">No {tab.toLowerCase()} payments</p>
            </div>
          ) : (
            payments.map((p) => {
              const fullName = p.user.profile
                ? `${p.user.profile.firstName} ${p.user.profile.lastName}`
                : p.user.email
              const isActioning = actionLoading === p.id
              const isRejecting = rejectTarget === p.id

              return (
                <div key={p.id} className="space-y-3 p-4">
                  {/* User + Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {fullName}
                      </p>
                      <p className="text-xs text-slate-400">{p.user.email}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${getPaymentStatusStyle(p.status as PaymentStatus)}`}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Amount</p>
                      <p className="text-aerojet-blue font-black dark:text-blue-400">
                        {formatCurrency(p.amount, p.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Method</p>
                      <p className="font-bold text-slate-600 dark:text-slate-400">
                        {p.paymentMethod?.replace(/_/g, ' ') ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Type</p>
                      <p className="font-bold text-slate-600 dark:text-slate-400">
                        {p.referenceType?.replace(/_/g, ' ') ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Date</p>
                      <p className="font-bold text-slate-600 dark:text-slate-400">
                        {formatDate(p.createdAt, 'SHORT')}
                      </p>
                    </div>
                  </div>

                  {/* Proof */}
                  {p.proofUrl && (
                    <div className="flex items-center gap-3">
                      <a
                        href={p.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-aerojet-sky hover:bg-aerojet-sky/10 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold transition-all duration-150 ease-out hover:shadow-sm"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View Proof
                      </a>
                      <button
                        onClick={() => handleOpenHistory(p.id)}
                        className="text-[10px] font-medium text-slate-400 hover:text-slate-600 hover:underline dark:hover:text-slate-200"
                      >
                        History
                      </button>
                    </div>
                  )}

                  {/* Actions (Pending tab) */}
                  {tab === PaymentStatus.PENDING && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={isActioning}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {isActioning && !isRejecting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectTarget(isRejecting ? null : p.id)}
                        disabled={isActioning}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-50 py-2.5 text-xs font-black text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  )}

                  {/* Inline reject form */}
                  {isRejecting && (
                    <div className="flex gap-2 rounded-xl bg-red-50 p-3">
                      <label htmlFor={`mobile-reject-reason-${p.id}`} className="sr-only">
                        Reason for rejection
                      </label>
                      <input
                        id={`mobile-reject-reason-${p.id}`}
                        name={`mobile-reject-reason-${p.id}`}
                        autoFocus
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason..."
                        autoComplete="off"
                        className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300 dark:bg-slate-900"
                      />
                      <button
                        onClick={handleReject}
                        disabled={!!actionLoading}
                        className="rounded-lg bg-red-500 px-3 py-2 text-xs font-black text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        {actionLoading === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Confirm'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setRejectTarget(null)
                          setRejectReason('')
                        }}
                        className="px-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {total > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 text-xs font-medium text-slate-400 dark:border-slate-800">
            {payments.length} of {total} payments
          </div>
        )}
      </div>

      <Dialog.Root
        open={!!historyTargetId}
        onOpenChange={(open) => !open && setHistoryTargetId(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-aerojet-blue text-lg font-black dark:text-white">
                Upload History
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                List of previous payment proof uploads for this transaction.
              </Dialog.Description>
              <Dialog.Close className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                <XCircle className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <div className="space-y-3">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="text-aerojet-sky h-6 w-6 animate-spin" />
                </div>
              ) : uploadHistory.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  No previous uploads found in history.
                </div>
              ) : (
                <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
                  {uploadHistory.map((file, i) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div>
                        <p className="mb-0.5 max-w-50 truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                          {file.filename}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(file.createdAt, 'DATETIME_SHORT')}
                          {i === 0 && (
                            <span className="text-aerojet-sky ml-2 font-bold">Latest</span>
                          )}
                        </p>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-aerojet-blue flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
