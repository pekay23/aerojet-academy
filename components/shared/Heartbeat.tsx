'use client'

import { useEffect } from 'react'

/**
 * Pings `/api/me/heartbeat` every 30s while this component is mounted in an
 * authenticated tab. The endpoint updates `User.lastSeenAt`, which powers
 * presence ("online now" pills + last-seen) on the messaging UI.
 *
 * Drop this into the highest-level authenticated layout (one per session is
 * enough). Multiple instances simply duplicate pings — harmless.
 *
 * The hook stops pinging when the tab is hidden (`visibilitychange`) so an
 * idle pinned tab doesn't masquerade as an active user. A fresh ping fires
 * the moment the tab returns to focus.
 */
export default function Heartbeat({ intervalMs = 30_000 }: { intervalMs?: number }) {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    const ping = async () => {
      try {
        const res = await fetch('/api/me/heartbeat', { method: 'POST', keepalive: true })
        if (!res.ok) return // silently ignore 401/403/etc. during unauthenticated states
      } catch {
        // network errors are also harmless for a best-effort ping
      }
    }

    const start = () => {
      if (timer != null) return
      ping()
      timer = setInterval(ping, intervalMs)
    }
    const stop = () => {
      if (timer != null) {
        clearInterval(timer)
        timer = null
      }
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') start()
      else stop()
    }

    start()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [intervalMs])

  return null
}
