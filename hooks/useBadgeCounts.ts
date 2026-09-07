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
        const data: BadgeCounts = await res.json()
        setCounts(data)
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
   
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
