'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface JoinPoolFormProps {
  poolId: string
  poolName: string
  seatPrice: number
  disabled?: boolean
}

export default function JoinPoolForm({ poolId, poolName, seatPrice, disabled }: JoinPoolFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/applicant/exam-only/join-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId, moduleCode: '' }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to join booking')
        return
      }

      if (data.promotedToStudent) {
        toast.success('Enrolled successfully! Redirecting to Student Portal...')
        setTimeout(() => {
          router.push('/student')
        }, 1500)
        return
      }

      toast.success(`Successfully joined ${poolName}! Funds have been reserved.`)
      router.push('/applicant/exam-bookings')
    } catch {
      toast.error('Network error while joining booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          By joining this booking, €{seatPrice.toFixed(2)} will be reserved from your wallet.
          You will be enrolled in <strong>{poolName}</strong>.
        </p>
      </div>
      <button
        onClick={handleSubmit}
        disabled={disabled || loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-aerojet-blue px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-aerojet-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {disabled ? 'Booking Full' : 'Confirm Join'}
      </button>
    </div>
  )
}
