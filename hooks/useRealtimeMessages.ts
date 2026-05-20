'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getRealtimeClient } from '@/lib/realtime/client'

/**
 * Subscribe to live inserts / updates on the `messages` table for the
 * current user. When a row arrives, refresh the current route so the
 * server-rendered thread tree picks up the new message — no full page
 * reload required.
 *
 * Requirements:
 *  - Supabase Realtime must be enabled for the `messages` table
 *    (Database → Tables → messages → toggle "Enable Realtime").
 *  - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` must
 *    be set in the deployment environment.
 *
 * Important: Prisma keeps field names camelCase by default, so the Postgres
 * column is literally `recipientId` (NOT `recipient_id`). The Supabase
 * Realtime filter must use the actual column name.
 *
 * Falls back to a polite no-op when Supabase isn't configured, so the
 * existing form-submit + `router.refresh()` flow still works.
 */
export function useRealtimeMessages(currentUserId: string | undefined) {
  const router = useRouter()

  useEffect(() => {
    if (!currentUserId) return
    const supabase = getRealtimeClient()
    if (!supabase) return

    const channel = supabase
      .channel(`messages:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipientId=eq.${currentUserId}`,
        },
        () => {
          toast('New message')
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `recipientId=eq.${currentUserId}`,
        },
        () => {
          router.refresh()
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Don't toast — degrade silently to the AutoRefresh polling
          // fallback. Surface in console for ops debugging.
          console.warn('[Realtime] messages channel:', status, err)
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUserId, router])
}
