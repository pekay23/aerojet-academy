'use client'

import { useState, useTransition } from 'react'
import { leaveExamPool } from '@/app/student/actions'
import { toast } from 'sonner'
import { LogOut, Loader2, AlertTriangle, X } from 'lucide-react'

interface LeavePoolButtonProps {
  poolId: string
  poolName: string
  amount: number
  currency: string
}

export default function LeavePoolButton({
  poolId,
  poolName,
  amount,
  currency,
}: LeavePoolButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const currencySymbol = currency === 'GHS' ? 'GH₵' : '€'

  const handleLeave = () => {
    startTransition(async () => {
      try {
        const res = await leaveExamPool(poolId)
        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success(
            `Left ${poolName}. ${currencySymbol}${amount.toFixed(2)} returned to your wallet.`
          )
          setOpen(false)
        }
      } catch {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
      >
        <LogOut className="h-3.5 w-3.5" />
        Leave
      </button>

      {/* Confirmation Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="font-black text-slate-900 dark:text-slate-100">Leave Pool?</h2>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You are about to leave <strong>{poolName}</strong>. Your reserved funds of{' '}
                <strong>
                  {currencySymbol}
                  {amount.toFixed(2)}
                </strong>{' '}
                will be returned to your available wallet balance.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => !isPending && setOpen(false)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
                >
                  Keep Seat
                </button>
                <button
                  onClick={handleLeave}
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Leaving...
                    </>
                  ) : (
                    'Confirm Leave'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
