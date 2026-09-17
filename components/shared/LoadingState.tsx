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
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {message || 'Loading...'}
      </div>
    )
  }

  if (variant === 'skeleton') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="space-y-3"
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center justify-center gap-3 py-16"
    >
      <Loader2 className="text-aerojet-blue h-8 w-8 animate-spin" aria-hidden="true" />
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : (
        <span className="sr-only">Loading...</span>
      )}
    </div>
  )
}
