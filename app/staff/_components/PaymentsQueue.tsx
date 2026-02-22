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
import { toast } from 'sonner'

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
  { key: 'PENDING', label: 'Pending', color: 'text-amber-600' },
  { key: 'APPROVED', label: 'Approved', color: 'text-emerald-600' },
  { key: 'REJECTED', label: 'Rejected', color: 'text-red-600' },
]

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
}

export default function PaymentsQueue({
  initialPendingCount,
  initialTab = 'PENDING',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#002a5c] uppercase dark:text-white">
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
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center dark:border-slate-800">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  tab === t.key
                    ? 'bg-white text-[#002a5c] shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-xs outline-none focus:ring-2 focus:ring-[#4c9ded] dark:border-slate-700 dark:bg-slate-800/50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
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
                        className="transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-bold text-slate-700">{fullName}</p>
                          <p className="text-xs text-slate-400">{p.user.email}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                          {p.referenceType?.replace(/_/g, ' ') ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-black text-[#002a5c]">
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
                            <a
                              href={p.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#4c9ded] hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> View
                            </a>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {tab === 'PENDING' ? (
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

        {total > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 text-xs font-medium text-slate-400 dark:border-slate-800">
            {payments.length} of {total} payments
          </div>
        )}
      </div>
    </div>
  )
}
