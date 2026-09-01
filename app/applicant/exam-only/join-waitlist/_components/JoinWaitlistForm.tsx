'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface JoinWaitlistFormProps {
  poolId: string
  poolName: string
  disabled?: boolean
}

export default function JoinWaitlistForm({ poolId, poolName, disabled }: JoinWaitlistFormProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/applicant/exam-only/join-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId, moduleCode: '' }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to join waitlist')
        return
      }

      toast.success(`Added to waitlist for ${poolName}. You will be auto-promoted if a seat opens.`)
      window.location.href = '/applicant/exam-bookings'
    } catch {
      toast.error('Network error while joining waitlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          By joining the waitlist, you will be placed in queue for <strong>{poolName}</strong>.
          If a seat becomes available, you will be auto-enrolled and notified.
        </p>
      </div>
      <button
        onClick={handleSubmit}
        disabled={disabled || loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {disabled ? 'Seats Available' : 'Join Waitlist'}
      </button>
    </div>
  )
}
