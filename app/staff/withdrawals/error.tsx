'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function WithdrawalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[WithdrawalsError]', error)
    }
  }, [error])

  return (
    <div
      className="mx-auto flex min-h-[50vh] w-full max-w-350 flex-col items-center justify-center px-4 py-8 text-center sm:px-6 lg:px-8"
      role="alert"
    >
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 dark:border-red-900/30 dark:bg-red-900/10">
        <AlertTriangle
          className="mx-auto h-10 w-10 text-red-600 dark:text-red-400"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-lg font-bold text-red-700 dark:text-red-400">
          Unable to load withdrawals
        </h2>
        <p className="mt-2 text-sm text-red-600 dark:text-red-300">
          The withdrawals data failed to load. Try again or go back.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:border-red-800 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-900/30 dark:focus-visible:outline-white"
          >
            Go Back
          </button>
        </div>
        <details className="mt-5 w-full max-w-md rounded-xl border border-red-200 bg-white p-4 text-left dark:border-red-900/50 dark:bg-red-950/30">
          <summary className="cursor-pointer text-sm font-bold text-red-700 dark:text-red-300">
            Technical details
          </summary>
          <pre className="mt-3 text-xs leading-relaxed break-words whitespace-pre-wrap text-red-700 dark:text-red-300">
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  )
}
