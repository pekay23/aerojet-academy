'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { getRealtimeClient } from '@/lib/realtime/client'

interface ExamSessionChange {
  studentId?: string
  [key: string]: unknown
}

interface UseRealtimeExamMonitorOptions {
  classId: string
  onSessionUpdate: (session: ExamSessionChange) => void
  onSessionInsert: (session: ExamSessionChange) => void
  enabled?: boolean
}

const STUDENT_THROTTLE_MS = 5_000
const DEBOUNCE_MS = 1_000
const RECONNECT_BACKOFF_MS = 5_000

export function useRealtimeExamMonitor({
  classId,
  onSessionUpdate,
  onSessionInsert,
  enabled = true,
}: UseRealtimeExamMonitorOptions) {
  const [isLive, setIsLive] = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof getRealtimeClient> extends null ? never : ReturnType<NonNullable<ReturnType<typeof getRealtimeClient>>['channel']>> | null>(null)
  const lastUpdateRef = useRef<Map<string, number>>(new Map())
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const maxReconnectAttempts = 10

  const flushDebounced = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  const scheduleDebounced = useCallback(
    (fn: () => void) => {
      flushDebounced()
      debounceTimerRef.current = setTimeout(fn, DEBOUNCE_MS)
    },
    [flushDebounced]
  )

  const teardown = useCallback(() => {
    flushDebounced()
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    const supabase = getRealtimeClient()
    if (supabase && channelRef.current) {
      void supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setIsLive(false)
  }, [flushDebounced])

  useEffect(() => {
    if (!enabled) {
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
      teardown()
      return
    }

    const supabase = getRealtimeClient()
    if (!supabase) {
      setIsLive(false)
      return
    }

    const channelName = `exam_sessions:classId:${classId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_exam_sessions',
          filter: `classId=eq.${classId}`,
        },
        (payload: { new: ExamSessionChange }) => {
          const studentId = payload.new?.studentId
          if (!studentId) return

          const now = Date.now()
          const last = lastUpdateRef.current.get(studentId) ?? 0
          if (now - last < STUDENT_THROTTLE_MS) return

          lastUpdateRef.current.set(studentId, now)

          scheduleDebounced(() => {
            onSessionInsert(payload.new)
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'internal_exam_sessions',
          filter: `classId=eq.${classId}`,
        },
        (payload: { new: ExamSessionChange }) => {
          const studentId = payload.new?.studentId
          if (!studentId) return

          const now = Date.now()
          const last = lastUpdateRef.current.get(studentId) ?? 0
          if (now - last < STUDENT_THROTTLE_MS) return

          lastUpdateRef.current.set(studentId, now)

          scheduleDebounced(() => {
            onSessionUpdate(payload.new)
          })
        }
      )
      .subscribe((status: string, err?: Error) => {
        if (status === 'SUBSCRIBED') {
          setIsLive(true)
          reconnectAttemptRef.current = 0
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsLive(false)
          console.warn(`[Realtime] exam monitor ${channelName}:`, status, err)

          if (reconnectAttemptRef.current < maxReconnectAttempts) {
            reconnectAttemptRef.current += 1
            reconnectTimerRef.current = setTimeout(() => {
              teardown()
              // Re-create subscription on next effect tick
              setIsLive(false)
            }, RECONNECT_BACKOFF_MS * reconnectAttemptRef.current)
          }
        }
      })

    channelRef.current = channel

    return () => {
      teardown()
    }
  }, [classId, enabled, onSessionUpdate, onSessionInsert, scheduleDebounced, teardown])

  return { isLive, flushDebounced }
}
