'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Send, CheckCircle2, XCircle, Building2 } from 'lucide-react'
import {
  createPartner145,
  initiate145Transfer,
  advance145Transfer,
} from '@/lib/part145/actions'

interface Org {
  id: string
  name: string
  easaApprovalRef: string | null
  contactEmail: string | null
}
interface Transfer {
  id: string
  status: string
  createdAt: string
  rejectedReason: string | null
  organisation: { name: string }
  user: {
    email: string
    profile: { firstName: string; lastName: string } | null
    studentProfile: { studentId: string } | null
  }
}

const STATUS_STYLE: Record<string, string> = {
  INITIATED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DATA_PACKAGED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SENT: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ACCEPTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function Part145Manager({
  organisations,
  transfers,
  isAdmin,
}: {
  organisations: Org[]
  transfers: Transfer[]
  isAdmin: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [org, setOrg] = useState({ name: '', easaApprovalRef: '', contactEmail: '' })
  const [xfer, setXfer] = useState({ student: '', organisationId: '' })

  const run = (fn: () => Promise<{ error?: string; success?: boolean }>, ok: string) =>
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast.error(res.error)
      else toast.success(ok)
    })

  return (
    <div className="space-y-8">
      {/* Organisations */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
          <Building2 className="h-3.5 w-3.5" /> Linked Part-145 Organisations
        </h2>
        <div className="flex flex-wrap gap-2">
          {organisations.map((o) => (
            <span
              key={o.id}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {o.name}
              {o.easaApprovalRef ? ` · ${o.easaApprovalRef}` : ''}
            </span>
          ))}
          {organisations.length === 0 && (
            <span className="text-xs text-slate-400">No partner organisations yet.</span>
          )}
        </div>
        {isAdmin && (
          <div className="grid gap-2 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
            <input
              value={org.name}
              onChange={(e) => setOrg((s) => ({ ...s, name: e.target.value }))}
              placeholder="Organisation name"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <input
              value={org.easaApprovalRef}
              onChange={(e) => setOrg((s) => ({ ...s, easaApprovalRef: e.target.value }))}
              placeholder="EASA approval ref"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <input
              value={org.contactEmail}
              onChange={(e) => setOrg((s) => ({ ...s, contactEmail: e.target.value }))}
              placeholder="Contact email"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              onClick={() =>
                run(() => createPartner145(org), 'Organisation added')
              }
              disabled={isPending}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-aerojet-blue px-3 py-2 text-sm font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        )}
      </section>

      {/* New transfer */}
      <section className="space-y-3">
        <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
          Initiate Student Transfer
        </h2>
        <div className="grid gap-2 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
          <input
            value={xfer.student}
            onChange={(e) => setXfer((s) => ({ ...s, student: e.target.value }))}
            placeholder="Student email or ID"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <select
            value={xfer.organisationId}
            onChange={(e) => setXfer((s) => ({ ...s, organisationId: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Select Part-145…</option>
            {organisations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              run(
                () => initiate145Transfer(xfer.student, xfer.organisationId),
                'Transfer packaged'
              )
            }
            disabled={isPending}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Package &amp; Initiate
          </button>
        </div>
      </section>

      {/* Transfers list */}
      <section className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Student</th>
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Part-145</th>
              <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {transfers.map((t) => {
              const name = t.user.profile
                ? `${t.user.profile.firstName} ${t.user.profile.lastName}`
                : t.user.email
              return (
                <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{name}</div>
                    <div className="text-xs text-slate-400">
                      {t.user.studentProfile?.studentId ?? t.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {t.organisation.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        STATUS_STYLE[t.status] ?? 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                    {t.rejectedReason && (
                      <p className="mt-1 text-xs text-red-500">{t.rejectedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {(t.status === 'DATA_PACKAGED' || t.status === 'INITIATED') && (
                        <button
                          disabled={isPending}
                          onClick={() => run(() => advance145Transfer(t.id, 'SENT'), 'Marked sent')}
                          className="rounded bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Mark Sent
                        </button>
                      )}
                      {t.status === 'SENT' && (
                        <>
                          <button
                            disabled={isPending}
                            onClick={() =>
                              run(() => advance145Transfer(t.id, 'ACCEPTED'), 'Accepted')
                            }
                            className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Accepted
                          </button>
                          <button
                            disabled={isPending}
                            onClick={() => {
                              const reason = window.prompt('Rejection reason?') ?? ''
                              run(
                                () => advance145Transfer(t.id, 'REJECTED', reason),
                                'Rejected'
                              )
                            }}
                            className="flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {transfers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                  No transfers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
