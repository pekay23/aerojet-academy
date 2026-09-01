'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ExamOnlyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    toast.error('Something went wrong loading the exam page.')
  }, [error])

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-900/10">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-black text-red-900 dark:text-red-100">
          Unable to load exam page
        </h2>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          Something went wrong while loading your exam information. This could be a temporary issue.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  )
}
