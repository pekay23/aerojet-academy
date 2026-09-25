'use client'
import { formatDate } from '@/lib/utils/formatters'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Download, Plus, DollarSign } from 'lucide-react'

interface PayoutRow {
  id: string
  referrerId: string
  referrerName: string
  referrerEmail: string
  amount: number
  currency: string
  periodStart: string
  periodEnd: string
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'
  paidAt: string | null
  notes: string | null
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-indigo-50 text-indigo-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
}

export default function PayoutsManager({ payouts }: { payouts: PayoutRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [periodStart, setPeriodStart] = useState(() =>
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  )
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10))

  const call = async (url: string, init: RequestInit, ok: string) => {
    const res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.success === false) {
      toast.error(json?.error || `Request failed (${res.status})`)
      return null
    }
    toast.success(ok)
    startTransition(() => router.refresh())
    return json
  }

  const onCreateRun = async () => {
    const json = await call(
      '/api/staff/referrals/payouts',
      {
        method: 'POST',
        body: JSON.stringify({ periodStart, periodEnd }),
      },
      'Payout run created'
    )
    if (!json) return
    toast.info(`${json.data?.created ?? 0} payout rows created`)
  }

  const onTransition = async (id: string, next: PayoutRow['status']) => {
    await call(
      `/api/staff/referrals/payouts/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      },
      `Payout ${next.toLowerCase()}`
    )
  }

  const onExport = async () => {
    const res = await fetch('/api/staff/referrals/payouts/export')
    if (!res.ok) {
      toast.error('Export failed')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `referral-payouts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Period start
          </label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Period end
          </label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <button
          disabled={isPending}
          onClick={onCreateRun}
          className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Create payout run
        </button>
        <button
          onClick={onExport}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" /> Export PENDING CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2">Referrer</th>
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{p.referrerName}</p>
                  <p className="text-xs text-slate-500">{p.referrerEmail}</p>
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {formatDate(p.periodStart)} → {formatDate(p.periodEnd)}
                </td>
                <td className="px-3 py-2 font-mono text-sm font-black">
                  <DollarSign className="inline h-3.5 w-3.5 text-emerald-600" />{' '}
                  {p.amount.toFixed(2)} {p.currency}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${STATUS_COLOR[p.status]}`}
                  >
                    {p.status}
                  </span>
                  {p.paidAt && (
                    <p className="mt-1 text-[10px] text-slate-400">paid {formatDate(p.paidAt)}</p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {p.status === 'PENDING' && (
                      <>
                        <button
                          disabled={isPending}
                          onClick={() => onTransition(p.id, 'APPROVED')}
                          className="rounded bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-30"
                        >
                          Approve
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => onTransition(p.id, 'REJECTED')}
                          className="rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-30"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === 'APPROVED' && (
                      <button
                        disabled={isPending}
                        onClick={() => onTransition(p.id, 'PAID')}
                        className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-30"
                      >
                        <Check className="inline h-3 w-3" /> Mark paid
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-400">
                  No payouts yet — create a run above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
