'use client'

import { useEffect, useState } from 'react'

interface PresenceEntry {
  userId: string
  online: boolean
  lastSeenAt: string | null
}

/**
 * Tiny presence indicator for a single peer. Renders either:
 *   • A green "online" dot + label, or
 *   • A muted last-seen timestamp (only when the viewer is permitted to see
 *     it — the server already enforces visibility, so we just render what we
 *     get).
 *
 * Polls `/api/messages/presence` every 30s. Lightweight enough for the
 * message-thread header — for a long list use the multi-peer `usePresence`
 * hook (in the same file) so one request covers all peers.
 */
export function PresencePill({ peerId }: { peerId: string }) {
  const entry = usePresenceFor(peerId)
  if (!entry) return null

  if (entry.online) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Online
      </span>
    )
  }

  if (entry.lastSeenAt) {
    return (
      <span className="text-xs text-slate-400">Last seen {formatLastSeen(entry.lastSeenAt)}</span>
    )
  }

  // Not online + last-seen is private → render nothing (no leakage)
  return null
}

function formatLastSeen(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString()
}

const cache = new Map<string, { entry: PresenceEntry; at: number }>()
const listeners = new Map<string, Set<(e: PresenceEntry) => void>>()
let scheduled = false
const pending = new Set<string>()

function flushFetch() {
  scheduled = false
  if (pending.size === 0) return
  const ids = Array.from(pending)
  pending.clear()
  const url = `/api/messages/presence?${ids.map((id) => `id=${encodeURIComponent(id)}`).join('&')}`
  fetch(url, { cache: 'no-store' })
    .then((res) => res.json())
    .then((json) => {
      const data: PresenceEntry[] = json?.data ?? []
      for (const entry of data) {
        cache.set(entry.userId, { entry, at: Date.now() })
        listeners.get(entry.userId)?.forEach((fn) => fn(entry))
      }
    })
    .catch(() => null)
}

function schedule(id: string) {
  pending.add(id)
  if (!scheduled) {
    scheduled = true
    setTimeout(flushFetch, 20)
  }
}

/**
 * Subscribe one component to a single peer's presence. Batches across all
 * mounted callers within a 20ms window so a thread with N peers makes one
 * request, not N.
 */
export function usePresenceFor(peerId: string, refreshMs = 30_000): PresenceEntry | null {
  const [entry, setEntry] = useState<PresenceEntry | null>(() => cache.get(peerId)?.entry ?? null)

  useEffect(() => {
    let mounted = true
    const onUpdate = (next: PresenceEntry) => {
      if (mounted) setEntry(next)
    }
    let set = listeners.get(peerId)
    if (!set) {
      set = new Set()
      listeners.set(peerId, set)
    }
    set.add(onUpdate)
    schedule(peerId)
    const t = setInterval(() => schedule(peerId), refreshMs)
    return () => {
      mounted = false
      set?.delete(onUpdate)
      clearInterval(t)
    }
  }, [peerId, refreshMs])

  return entry
}
