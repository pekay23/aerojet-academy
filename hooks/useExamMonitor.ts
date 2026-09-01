'use client'

import { useEffect } from 'react'
import { getRealtimeClient } from '@/lib/realtime/client'
import { usePollVisibility } from './usePollVisibility'

/**
 * Combines Supabase Realtime (INSERT/UPDATE on `internal_exam_sessions` for a
 * class) with visibility-based polling. GET-first pattern: every event simply
 * triggers `onRefresh`, which re-fetches the authoritative monitor snapshot.
 * Degrades gracefully to polling only when Supabase isn't configured.
 */
export function useExamMonitor(classId: string | null, onRefresh: () => void) {
  usePollVisibility({ intervalMs: 15_000, onTick: onRefresh, enabled: !!classId })

  useEffect(() => {
    if (!classId) return
    const supabase = getRealtimeClient()
    if (!supabase) return

    const channel = supabase
      .channel(`internal_exam_sessions:${classId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'internal_exam_sessions', filter: `classId=eq.${classId}` },
        () => onRefresh()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'internal_exam_sessions', filter: `classId=eq.${classId}` },
        () => onRefresh()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [classId, onRefresh])
}
