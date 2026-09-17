'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { requestWithdrawal } from '@/lib/withdrawal/actions'

export default function WithdrawalForm() {
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const submit = () => {
    if (reason.trim().length < 10) {
      toast.error('Please provide a more detailed reason (at least 10 characters).')
      return
    }
    if (!confirmed) {
      toast.error('Please confirm you understand this starts a formal withdrawal process.')
      return
    }
    startTransition(async () => {
      const res = await requestWithdrawal(reason)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Withdrawal request submitted')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={5}
        placeholder="Reason for withdrawal…"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-700 dark:bg-slate-800/50"
      />
      <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />
        <span>
          I understand this begins a formal withdrawal that is only final after staff confirmation
          and administrator approval.
        </span>
      </label>
      <button
        onClick={submit}
        disabled={isPending}
        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
      >
        {isPending ? 'Submitting…' : 'Submit Withdrawal Request'}
      </button>
    </div>
  )
}
