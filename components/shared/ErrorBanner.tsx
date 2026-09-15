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
 *
 * SECURITY: `message` is rendered as text content via JSX interpolation.
 * React automatically escapes string values, so XSS via the `message` prop
 * is not possible. Only pass static strings or server-validated error messages.
 */
export function ErrorBanner({ message, onRetry, onDismiss, variant = 'inline' }: ErrorBannerProps) {
  if (variant === 'page') {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-4 rounded-md border border-destructive/20 bg-destructive/10 p-4 sm:p-8 text-center"
      >
        <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-bold text-destructive">Something went wrong</h3>
          <p className="mt-1 text-sm text-destructive/80">{message}</p>
        </div>
        <div className="flex gap-2">
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry} aria-label="Retry">
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
              <X className="mr-2 h-4 w-4" aria-hidden="true" />
              Dismiss
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} aria-label="Retry" className="text-xs font-bold underline hover:no-underline">
          Retry
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 text-destructive/70 hover:text-destructive"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
