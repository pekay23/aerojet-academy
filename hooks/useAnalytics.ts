'use client'

import { useEffect } from 'react'
import { trackPageView, trackFeatureUsage } from '@/lib/analytics/events'

/**
 * Hook to automatically track page views on mount.
 * Usage: Add to any client component or layout.
 */
export function useAnalytics(options?: { trackFeature?: string }) {
  useEffect(() => {
    // Track page view
    const path = window.location.pathname + window.location.search
    const referrer = document.referrer || undefined

    trackPageView(path, undefined, referrer).catch(() => {
      // Silently fail - analytics must not break the app
    })

    // Track feature usage if specified
    if (options?.trackFeature) {
      trackFeatureUsage(options.trackFeature).catch(() => {})
    }
  }, [options?.trackFeature])
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
