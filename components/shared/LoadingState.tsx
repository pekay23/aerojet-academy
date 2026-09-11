'use client'

import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  rows?: number
  variant?: 'spinner' | 'skeleton' | 'inline'
}

/**
 * Reusable loading state component.
 * - `spinner`: centered spinner (default)
 * - `skeleton`: table-like skeleton rows
 * - `inline`: small spinner with optional message
 */
export function LoadingState({ message, rows = 5, variant = 'spinner' }: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {message || 'Loading...'}
      </div>
    )
  }

  if (variant === 'skeleton') {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 className="text-aerojet-blue h-8 w-8 animate-spin" />
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </div>
  )
}
