'use client'

import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

/**
 * Mounts the message-inbox Realtime subscription. Returns no UI — it just
 * keeps a Supabase WebSocket open and triggers `router.refresh()` whenever
 * a new message lands in the user's inbox.
 *
 * Place inside any server page that lists messages.
 */
export default function MessagesRealtime({ userId }: { userId: string }) {
  useRealtimeMessages(userId)
  return null
}
