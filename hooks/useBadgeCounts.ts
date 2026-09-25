'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface BadgeCounts {
  notifications: number
  messages: number
  applicants?: number
  enrollments?: number
  payments?: number
  pendingGrading?: number
}

const DEFAULT_POLL_INTERVAL = 30000 // 30 seconds

function isValidBadgeCounts(data: unknown): data is BadgeCounts {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  const allowedKeys = [
    'notifications',
    'messages',
    'applicants',
    'enrollments',
    'payments',
    'pendingGrading',
  ]
  const keys = Object.keys(d)
  if (keys.some((k) => !allowedKeys.includes(k))) return false
  return (
    typeof d.notifications === 'number' &&
    Number.isFinite(d.notifications) &&
    typeof d.messages === 'number' &&
    Number.isFinite(d.messages) &&
    (d.applicants === undefined ||
      (typeof d.applicants === 'number' && Number.isFinite(d.applicants))) &&
    (d.enrollments === undefined ||
      (typeof d.enrollments === 'number' && Number.isFinite(d.enrollments))) &&
    (d.payments === undefined || (typeof d.payments === 'number' && Number.isFinite(d.payments))) &&
    (d.pendingGrading === undefined ||
      (typeof d.pendingGrading === 'number' && Number.isFinite(d.pendingGrading)))
  )
}

export function useBadgeCounts(
  initialCounts?: Partial<BadgeCounts>,
  pollInterval = DEFAULT_POLL_INTERVAL
) {
  const [counts, setCounts] = useState<BadgeCounts>({
    notifications: initialCounts?.notifications ?? 0,
    messages: initialCounts?.messages ?? 0,
    applicants: initialCounts?.applicants,
    enrollments: initialCounts?.enrollments,
    payments: initialCounts?.payments,
    pendingGrading: initialCounts?.pendingGrading,
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/badge-counts')
      if (res.ok) {
        const data = await res.json()
        if (isValidBadgeCounts(data)) {
          setCounts(data)
        }
        // Ignore malformed/error-shaped responses — keep stale counts
      }
    } catch {
      // Silently fail — stale counts are fine
    }
  }, [])

  // Immediate refresh function for manual triggers (e.g., after marking as read)
  const refresh = useCallback(() => {
    fetchCounts()
  }, [fetchCounts])

  useEffect(() => {
    // Fetch immediately on mount
    fetchCounts()

    // Set up polling
    intervalRef.current = setInterval(fetchCounts, pollInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchCounts, pollInterval])

  return { counts, refresh }
}
