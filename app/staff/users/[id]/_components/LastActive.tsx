'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  ts: string | null | undefined
}

/**
 * Client component so `Date.now()` runs in the browser via the lazy
 * state initializer, not the server.
 *
 * Server components cannot call impure functions like `Date.now()` — the
 * react-hooks/purity rule flags them because the component body must be
 * idempotent. Wrapping the dynamic time display here keeps the parent page
 * pure while preserving the "Online now" indicator (matching the presence
 * ONLINE_THRESHOLD_MS of 90s).
 */
export default function LastActive({ ts }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  if (!ts) return <span>Never active</span>
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return <span>Never active</span>
  const ms = now - d.getTime()
  if (ms < 0) return <span>{d.toLocaleDateString()}</span>
  // Within 90s → "online now" (matches presence ONLINE_THRESHOLD_MS)
  if (ms < 90_000) {
    return <span className="text-emerald-600 dark:text-emerald-400">Online now</span>
  }
  return <span>{formatDistanceToNow(d, { addSuffix: true })}</span>
}
