'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import {
  staffConfirmWithdrawal,
  rejectWithdrawal,
  adminApproveWithdrawal,
} from '@/lib/withdrawal/actions'

interface WR {
  id: string
  reason: string
  status: string
  createdAt: string
  rejectedReason: string | null
  user: {
    email: string
    profile: { firstName: string; lastName: string } | null
    studentProfile: { studentId: string } | null
  }
}

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-700',
  STAFF_CONFIRMED: 'bg-blue-100 text-blue-700',
  ADMIN_APPROVED: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export default function WithdrawalsManager({
  requests,
  isAdmin,
}: {
  requests: WR[]
  isAdmin: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<string>('OPEN')

  const run = (fn: () => Promise<{ error?: string; success?: boolean }>, ok: string) =>
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast.error(res.error)
      else toast.success(ok)
    })

  const visible = requests.filter((r) =>
    filter === 'OPEN'
      ? ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'].includes(r.status)
      : filter === 'ALL'
        ? true
        : r.status === filter
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['OPEN', 'ALL', 'COMPLETED', 'REJECTED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
              filter === f
                ? 'border-aerojet-blue bg-aerojet-blue text-white'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Student
              </th>
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Reason
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {visible.map((r) => {
              const name = r.user.profile
                ? `${r.user.profile.firstName} ${r.user.profile.lastName}`
                : r.user.email
              const canConfirm = r.status === 'REQUESTED'
              const canApprove =
                isAdmin && (r.status === 'REQUESTED' || r.status === 'STAFF_CONFIRMED')
              const canReject = ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'].includes(
                r.status
              )
              return (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{name}</div>
                    <div className="text-xs text-slate-400">
                      {r.user.studentProfile?.studentId ?? r.user.email}
                    </div>
                  </td>
                  <td className="max-w-[320px] px-4 py-3 text-slate-600 dark:text-slate-300">
                    <p className="line-clamp-2">{r.reason}</p>
                    {r.rejectedReason && (
                      <p className="mt-1 text-xs text-red-500">Note: {r.rejectedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        STATUS_STYLE[r.status] ?? 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {canConfirm && (
                        <button
                          disabled={isPending}
                          onClick={() =>
                            run(() => staffConfirmWithdrawal(r.id), 'Confirmed')
                          }
                          className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Confirm
                        </button>
                      )}
                      {canApprove && (
                        <button
                          disabled={isPending}
                          onClick={() =>
                            run(() => adminApproveWithdrawal(r.id), 'Withdrawal approved')
                          }
                          className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3 w-3" /> Approve
                        </button>
                      )}
                      {canReject && (
                        <button
                          disabled={isPending}
                          onClick={() => {
                            const reason = window.prompt('Reason for rejection?') ?? ''
                            run(() => rejectWithdrawal(r.id, reason), 'Rejected')
                          }}
                          className="flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                  No withdrawal requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
