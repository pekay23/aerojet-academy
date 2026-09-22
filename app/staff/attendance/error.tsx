'use client'

import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AttendanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-red-100 bg-white p-8 text-center sm:p-12 dark:border-red-900/30 dark:bg-slate-900"
      role="alert"
    >
      <AlertTriangle className="h-10 w-10 text-red-500 dark:text-red-400" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
        Unable to load attendance data
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        The attendance records failed to load. Try again or go back.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-aerojet-blue hover:bg-aerojet-sky focus-visible:outline-aerojet-blue rounded-xl px-4 py-2 text-xs font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="focus-visible:outline-aerojet-blue rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Go Back
        </button>
      </div>
      {error.digest && (
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Reference ID: {error.digest}
        </p>
      )}
    </div>
  )
}
