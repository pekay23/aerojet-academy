'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error('[ExpiringDocumentsError]', error.message)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4" role="alert">
      <div className="w-full max-w-md text-center">
        <AlertTriangle
          className="mx-auto h-10 w-10 text-red-500 dark:text-red-400"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-slate-100">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The expiring documents data failed to load. Try again or go back.
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
        <details className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-700 dark:bg-slate-800/50">
          <summary className="cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300">
            Technical details
          </summary>
          <pre className="mt-3 text-xs leading-relaxed break-words whitespace-pre-wrap text-slate-600 dark:text-slate-400">
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  )
}
