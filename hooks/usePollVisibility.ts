'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UsePollVisibilityOptions {
  intervalMs?: number
  onTick: () => void
  enabled?: boolean
}

export function usePollVisibility({
  intervalMs = 30_000,
  onTick,
  enabled = true,
}: UsePollVisibilityOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (intervalRef.current != null) return
    intervalRef.current = setInterval(onTick, intervalMs)
  }, [onTick, intervalMs])

  const stop = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      stop()
      return
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        onTick()
        start()
      } else {
        stop()
      }
    }

    if (document.visibilityState === 'visible') {
      onTick()
      start()
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, onTick, start, stop])
}
