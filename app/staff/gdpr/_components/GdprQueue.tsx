'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Clock, CheckCircle2, AlertOctagon, Download, Trash2 } from 'lucide-react'

interface DsrRow {
  id: string
  requestType: string
  status: 'RECEIVED' | 'IN_PROGRESS' | 'AWAITING_USER' | 'COMPLETED' | 'DENIED' | 'CANCELLED'
  requestedAt: string
  dueBy: string
  completedAt: string | null
  notes: string | null
  decisionReason: string | null
  user: { id: string; email: string; name: string }
  assignedToEmail: string | null
}

const STATUS_COLOR: Record<string, string> = {
  RECEIVED: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700',
  AWAITING_USER: 'bg-purple-50 text-purple-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  DENIED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export default function GdprQueue({ requests }: { requests: DsrRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'open' | 'all' | 'overdue'>('open')

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const visible = requests.filter((r) => {
    if (filter === 'open') return !['COMPLETED', 'DENIED', 'CANCELLED'].includes(r.status)
    if (filter === 'overdue') return r.status !== 'COMPLETED' && new Date(r.dueBy).getTime() < now
    return true
  })

  const call = async (url: string, init: RequestInit, ok: string) => {
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

  const onTransition = async (id: string, status: DsrRow['status']) => {
    await call(`/api/staff/gdpr/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }, `Status -> ${status}`)
  }

  const onExport = (userId: string) => {
    window.open(`/api/staff/users/${userId}/gdpr-export`, '_blank')
  }

  const onAnonymise = async (userId: string, name: string, email: string) => {
    const confirmEmail = prompt(`Type the user's email (${email}) to confirm anonymisation:`)
    if (confirmEmail !== email) {
      toast.error('Email did not match - aborted')
      return
    }
    const reason = prompt('Reason for anonymisation:')
    if (!reason) return
    await call(`/api/staff/users/${userId}/anonymise`, {
      method: 'POST',
      body: JSON.stringify({ reason, confirmEmail }),
    }, `${name} anonymised`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(['open', 'overdue', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold ${filter === f ? 'bg-aerojet-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {f === 'open' ? 'Open' : f === 'overdue' ? 'Overdue' : 'All'}
          </button>
        ))}
        <a href="/staff/settings/retention" className="ml-auto text-sm font-bold text-aerojet-blue hover:underline">
          Edit retention policies {'->'}
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Assignee</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const overdue = r.status !== 'COMPLETED' && new Date(r.dueBy).getTime() < now
              return (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{r.user.name}</p>
                    <p className="text-xs text-slate-500">{r.user.email}</p>
                  </td>
                  <td className="px-3 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black tracking-widest text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">{r.requestType}</span></td>
                  <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${STATUS_COLOR[r.status]}`}>{r.status}</span></td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'font-black text-red-600' : 'text-slate-500'}`}>
                      {overdue ? <AlertOctagon className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {new Date(r.dueBy).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{r.assignedToEmail ?? '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {r.requestType === 'ACCESS' && (
                        <button onClick={() => onExport(r.user.id)} className="flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100">
                          <Download className="h-3 w-3" /> Export
                        </button>
                      )}
                      {r.requestType === 'ERASURE' && r.status !== 'COMPLETED' && (
                        <button onClick={() => onAnonymise(r.user.id, r.user.name, r.user.email)} className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100">
                          <Trash2 className="h-3 w-3" /> Anonymise
                        </button>
                      )}
                      {r.status !== 'COMPLETED' && (
                        <>
                          {r.status === 'RECEIVED' && (
                            <button disabled={isPending} onClick={() => onTransition(r.id, 'IN_PROGRESS')} className="rounded bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-30">Start</button>
                          )}
                          <button disabled={isPending} onClick={() => onTransition(r.id, 'COMPLETED')} className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-30">
                            <CheckCircle2 className="inline h-3 w-3" /> Complete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-400">No requests match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
