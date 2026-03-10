'use client'

import { useState, useTransition } from 'react'
import { bookResitExamAction } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, RefreshCcw, Wallet } from 'lucide-react'

interface ResitBookingButtonProps {
  examId: string
  examName: string
}

export default function ResitBookingButton({ examId, examName }: ResitBookingButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleResit = () => {
    setShowConfirm(false)
    startTransition(async () => {
      try {
        const res = await bookResitExamAction(examId)
        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success(`Resit for ${examName} booked successfully!`)
        }
      } catch {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600 transition-all hover:bg-amber-100 disabled:opacity-50 dark:bg-amber-900/20 dark:text-amber-400"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCcw className="h-3.5 w-3.5" />
        )}
        Book Resit
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
            aria-labelledby="resit-booking-title"
            onKeyDown={(e) => { if (e.key === 'Escape') setShowConfirm(false) }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <RefreshCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="resit-booking-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Confirm Resit Booking
                  </h3>
                  <p className="text-sm text-slate-500">Are you sure you want to book a resit?</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Module</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{examName}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
                <div className="mb-2 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Payment Required
                  </p>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-500">
                  The resit fee will be deducted directly from your wallet balance. Ensure you have
                  sufficient funds before confirming.
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
                onClick={handleResit}
                className="flex-1 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700"
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
