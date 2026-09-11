'use client'

import { AlertCircle, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  variant?: 'inline' | 'page'
}

/**
 * Reusable error banner for inline errors within pages.
 * Use `variant="page"` for full-width page-level errors.
 */
export function ErrorBanner({ message, onRetry, onDismiss, variant = 'inline' }: ErrorBannerProps) {
  if (variant === 'page') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800/50 dark:bg-red-900/10">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div>
          <h3 className="text-lg font-bold text-red-800 dark:text-red-200">Something went wrong</h3>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{message}</p>
        </div>
        <div className="flex gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="mr-2 h-4 w-4" />
              Dismiss
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/10 dark:text-red-300">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-bold underline hover:no-underline">
          Retry
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 text-red-400 hover:text-red-600"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
