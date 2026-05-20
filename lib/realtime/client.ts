'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client used solely for Realtime subscriptions.
 *
 * Auth + data writes still go through NextAuth + Prisma. This client only
 * opens a WebSocket to Supabase Realtime so the UI can react to row
 * changes (new messages, status updates) without a full page refresh.
 *
 * Returns `null` when Supabase isn't configured (e.g. CI/dev without env);
 * callers should treat that as a graceful no-op.
 */

let cached: ReturnType<typeof createBrowserClient> | null | undefined

export function getRealtimeClient() {
  if (cached !== undefined) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    cached = null
    return cached
  }
  cached = createBrowserClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 5 } },
  })
  return cached
}
