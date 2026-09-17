'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Hook to automatically track page views on route changes.
 * Usage: Add to any client component or layout.
 */
export function useAnalytics(options?: { trackFeature?: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const path = useMemo(() => {
    const sp = searchParams?.toString()
    return sp ? `${pathname}?${sp}` : pathname
  }, [pathname, searchParams])

  useEffect(() => {
    const referrer = document.referrer || undefined

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'PAGE_VIEW', data: { path, referrer } }),
    }).catch(() => {
      // Silently fail - analytics must not break the app
    })

    if (options?.trackFeature) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'FEATURE_USED', data: { feature: options.trackFeature } }),
      }).catch(() => {})
    }
  }, [path, options?.trackFeature])
}

/**
 * Hook to track search queries.
 */
export function useSearchTracking() {
  return useAnalytics({ trackFeature: 'search' })
}

/**
 * Hook to track specific feature interactions.
 */
export function useFeatureTracking(feature: string) {
  return useAnalytics({ trackFeature: feature })
}
