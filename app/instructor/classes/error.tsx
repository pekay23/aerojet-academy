'use client'

import { useEffect } from 'react'
import { ChevronLeft, RefreshCw, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Instructor Classes Page Error:', error)
  }, [error])

  return (
    <div className="animate-in fade-in flex flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full',
          'bg-red-50 dark:bg-red-500/10'
        )}
      >
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Something went wrong</h2>
        <p className="max-w-md text-slate-500 dark:text-slate-400">
          We couldn't load your classes. This might be a temporary issue or a configuration problem.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all',
            'bg-aerojet-sky hover:bg-aerojet-blue text-white'
          )}
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <Link
          href="/instructor/dashboard"
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all',
            'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
