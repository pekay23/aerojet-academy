'use client'

import { useState, useTransition } from 'react'
import { bookResitExamAction } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, RefreshCcw } from 'lucide-react'

interface ResitBookingButtonProps {
  examId: string
  examName: string
}

export default function ResitBookingButton({ examId, examName }: ResitBookingButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleResit = () => {
    if (
      !confirm(
        `Are you sure you want to book a resit for ${examName}? This will charge your wallet for the resit fee.`
      )
    ) {
      return
    }

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
    <button
      onClick={handleResit}
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
  )
}
