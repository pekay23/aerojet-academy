'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import {
  Search,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import { PaymentStatus } from '@/types/enums'

interface FileUpload {
  id: string
  url: string
  filename: string
  createdAt: string
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  paymentMethod: string
  referenceType?: string | null
  referenceCode?: string | null
  proofUrl?: string | null
  createdAt: string
  user: {
    id: string
    email: string
    profile?: { firstName: string; lastName: string } | null
  }
}

const TABS = [
  { key: PaymentStatus.PENDING, label: 'Pending', color: 'text-amber-600' },
  { key: PaymentStatus.APPROVED, label: 'Approved', color: 'text-emerald-600' },
  { key: PaymentStatus.REJECTED, label: 'Rejected', color: 'text-red-600' },
]

const STATUS_STYLE: Record<string, string> = {
  [PaymentStatus.PENDING]: 'bg-amber-100 text-amber-700',
  [PaymentStatus.APPROVED]: 'bg-emerald-100 text-emerald-700',
  [PaymentStatus.REJECTED]: 'bg-red-100 text-red-600',
}

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
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue uppercase dark:text-white">
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
          <div className="flex gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner ring-1 ring-black/5 dark:bg-slate-800/80 dark:ring-white/5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative rounded-full px-4 py-1.5 text-xs font-bold transition-colors duration-150 ${
                  tab === t.key
                    ? 'text-aerojet-blue dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab === t.key && (
                  <motion.div
                    layoutId="payments-tab"
                    className="absolute inset-0 bg-white shadow-md ring-1 ring-black/5 dark:bg-slate-700 dark:ring-white/10"
                    style={{ borderRadius: 9999, zIndex: 0 }}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-60">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user or ref..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-xs outline-none focus:ring-2 focus:ring-aerojet-sky dark:border-slate-700 dark:bg-slate-800/50"
            />
          </div>
        </div>

        {/* Table */}
        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                {[
                  'User',
                  'Type',
                  'Amount',
                  'Method',
                  'Status',
                  'Proof',
                  tab === 'PENDING' ? 'Actions' : 'Date',
                ].map((h) => (
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
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <CreditCard className="mx-auto mb-2 h-10 w-10 text-slate-200" />
                    <p className="text-sm font-bold text-slate-400">
                      No {tab.toLowerCase()} payments
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const fullName = p.user.profile
                    ? `${p.user.profile.firstName} ${p.user.profile.lastName}`
                    : p.user.email
                  const isActioning = actionLoading === p.id
                  const isRejecting = rejectTarget === p.id

                  return (
                    <Fragment key={p.id}>
                      <tr
                        key={p.id}
                        className="transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-bold text-slate-700">{fullName}</p>
                          <p className="text-xs text-slate-400">{p.user.email}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                          {p.referenceType?.replace(/_/g, ' ') ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-black text-aerojet-blue">
                          {p.currency}{' '}
                          {Number(p.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                          {p.paymentMethod.replace(/_/g, ' ')}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_STYLE[p.status] ?? 'bg-slate-100 text-slate-500'}`}
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
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold text-aerojet-sky transition-all duration-150 ease-out hover:bg-aerojet-sky/10 hover:shadow-sm"
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
                              {new Date(p.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Inline reject form */}
                      {isRejecting && (
                        <tr key={`reject-${p.id}`} className="bg-red-50">
                          <td colSpan={7} className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection..."
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
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_STYLE[p.status] ?? 'bg-slate-100 text-slate-500'}`}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Amount</p>
                      <p className="font-black text-aerojet-blue dark:text-blue-400">
                        {p.currency}{' '}
                        {Number(p.amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold tracking-wider text-slate-400 uppercase">Method</p>
                      <p className="font-bold text-slate-600 dark:text-slate-400">
                        {p.paymentMethod.replace(/_/g, ' ')}
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
                        {new Date(p.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
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
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold text-aerojet-sky transition-all duration-150 ease-out hover:bg-aerojet-sky/10 hover:shadow-sm"
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
                      <input
                        autoFocus
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason..."
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
              <Dialog.Title className="text-lg font-black text-aerojet-blue dark:text-white">
                Upload History
              </Dialog.Title>
              <Dialog.Close className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                <XCircle className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <div className="space-y-3">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-aerojet-sky" />
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
                        <p className="mb-0.5 max-w-[200px] truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                          {file.filename}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(file.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                          {i === 0 && <span className="ml-2 font-bold text-aerojet-sky">Latest</span>}
                        </p>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:text-aerojet-blue hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
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
