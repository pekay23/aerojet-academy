'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SchedulingError({ _error, reset }: { _error: Error; reset: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-describedby="scheduling-error-description"
      className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="text-lg font-black text-slate-900 dark:text-white">Something went wrong</h2>
      <p
        id="scheduling-error-description"
        className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400"
      >
        This section failed to load. Try again or return to the previous page.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-aerojet-blue hover:bg-aerojet-sky rounded-xl px-4 py-2 text-xs font-bold text-white"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}
