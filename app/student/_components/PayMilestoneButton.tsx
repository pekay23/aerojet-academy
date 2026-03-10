'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Wallet, Loader2, AlertCircle } from 'lucide-react'

interface Props {
  milestoneId: string
  amount: number
  currency: string
  label: string
}

export default function PayMilestoneButton({ milestoneId, amount, currency, label }: Props) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handlePay = async () => {
    setLoading(true)
    setShowConfirm(false)
    try {
      const res = await fetch('/api/student/milestones/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to process payment.')
        return
      }

      toast.success('Payment successful!')
      router.refresh()
    } catch (error) {
      toast.error('A network error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wallet className="h-3 w-3" />}
        Pay from Wallet
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pay-milestone-title"
            onKeyDown={(e) => { if (e.key === 'Escape') setShowConfirm(false) }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="pay-milestone-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Confirm Payment
                  </h3>
                  <p className="text-sm text-slate-500">
                    Are you sure you want to pay for {label}?
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    Amount to Pay
                  </p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {currency} {amount.toLocaleString()}
                  </p>
                </div>
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-500">
                  This amount will be deducted directly from your wallet balance.
                </p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
