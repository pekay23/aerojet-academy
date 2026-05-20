'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, Shield, ShieldOff, Play } from 'lucide-react'

interface ReferralRow {
  id: string
  status: 'PENDING' | 'QUALIFIED' | 'DISQUALIFIED'
  fraudScore: number
  fraudReasons: string[]
  createdAt: string
  reviewedAt: string | null
  referrer: { id: string; email: string; isAmbassador: boolean; name: string }
  referee: { id: string; email: string; name: string }
}

export default function ReferralsManager({
  initialReferrals,
  currentFilters,
}: {
  initialReferrals: ReferralRow[]
  currentFilters: { status: string | null; minFraud: number | null }
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState(currentFilters.status ?? '')
  const [minFraud, setMinFraud] = useState(String(currentFilters.minFraud ?? ''))

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (minFraud) params.set('minFraud', minFraud)
    router.push(`/staff/referrals${params.size ? `?${params}` : ''}`)
  }

  const callJson = async (url: string, init: RequestInit, ok: string) => {
    const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.success === false) {
      toast.error(json?.error || `Request failed (${res.status})`)
      return false
    }
    toast.success(ok)
    startTransition(() => router.refresh())
    return true
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const onBulkDisqualify = async () => {
    if (selected.size === 0) return
    const reason = prompt(`Disqualify ${selected.size} referral(s). Reason?`)
    if (!reason) return
    await callJson('/api/staff/referrals/bulk', {
      method: 'POST',
      body: JSON.stringify({ action: 'disqualify', ids: Array.from(selected), reason }),
    }, `Disqualified ${selected.size} referrals`)
    setSelected(new Set())
  }

  const onRevokeAmbassador = async (userId: string, name: string) => {
    const reason = prompt(`Revoke ambassador status for ${name}. Reason?`)
    if (!reason) return
    await callJson(`/api/staff/referrals/ambassador/${userId}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }, 'Ambassador revoked')
  }

  const onRunFraud = async () => {
    await callJson('/api/staff/referrals/fraud-scan', { method: 'POST', body: '{}' }, 'Fraud scan complete')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="DISQUALIFIED">Disqualified</option>
        </select>
        <input
          value={minFraud}
          onChange={(e) => setMinFraud(e.target.value)}
          placeholder="Min fraud score"
          type="number"
          className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button onClick={applyFilters} className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600">
          Apply
        </button>
        <div className="ml-auto flex gap-2">
          <button
            disabled={isPending}
            onClick={onRunFraud}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> Run fraud scan
          </button>
          <button
            disabled={isPending || selected.size === 0}
            onClick={onBulkDisqualify}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <ShieldOff className="h-4 w-4" /> Disqualify ({selected.size})
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2"><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? new Set(initialReferrals.map((r) => r.id)) : new Set())} /></th>
              <th className="px-3 py-2">Referrer</th>
              <th className="px-3 py-2">Referee</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Fraud</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialReferrals.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                <td className="px-3 py-2">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{r.referrer.name}</p>
                  <p className="text-xs text-slate-500">{r.referrer.email}</p>
                  {r.referrer.isAmbassador && (
                    <button onClick={() => onRevokeAmbassador(r.referrer.id, r.referrer.name)} className="mt-1 inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 hover:text-red-600">
                      <Shield className="h-3 w-3" /> Ambassador (revoke)
                    </button>
                  )}
                </td>
                <td className="px-3 py-2">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{r.referee.name}</p>
                  <p className="text-xs text-slate-500">{r.referee.email}</p>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                    r.status === 'QUALIFIED' ? 'bg-emerald-50 text-emerald-700'
                    : r.status === 'DISQUALIFIED' ? 'bg-red-50 text-red-700'
                    : 'bg-slate-100 text-slate-600'
                  }`}>{r.status}</span>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1 font-mono text-xs font-black ${
                    r.fraudScore >= 50 ? 'text-red-600' : r.fraudScore >= 30 ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {r.fraudScore >= 30 && <AlertTriangle className="h-3 w-3" />} {r.fraudScore}
                  </span>
                  {r.fraudReasons.length > 0 && (
                    <p className="mt-0.5 text-[10px] text-slate-400">{r.fraudReasons.join(', ')}</p>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  <button
                    disabled={isPending || r.status === 'DISQUALIFIED'}
                    onClick={async () => {
                      const reason = prompt('Disqualify reason?')
                      if (!reason) return
                      await callJson('/api/staff/referrals/bulk', {
                        method: 'POST',
                        body: JSON.stringify({ action: 'disqualify', ids: [r.id], reason }),
                      }, 'Disqualified')
                    }}
                    className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-30"
                  >
                    Disqualify
                  </button>
                </td>
              </tr>
            ))}
            {initialReferrals.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">No referrals match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
