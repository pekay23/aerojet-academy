'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react'

interface PayRegistrationFeeButtonProps {
  fee: number
  symbol: string
  currency: string
}

export default function PayRegistrationFeeButton({
  fee,
  symbol,
  currency,
}: PayRegistrationFeeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handlePay() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/student/registration-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Payment failed. Please try again.')
        return
      }

      setSuccess(true)
      // Refresh the page to show paid state
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800/50 dark:bg-emerald-900/10">
        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
          Registration fee paid successfully!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handlePay}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#001d42] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Pay {symbol}{fee.toFixed(2)} {currency} with Wallet
          </>
        )}
      </button>
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/10 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
