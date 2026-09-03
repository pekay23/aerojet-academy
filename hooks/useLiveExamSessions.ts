'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRealtimeExamMonitor } from '@/hooks/useRealtimeExamMonitor'
import { usePollVisibility } from '@/hooks/usePollVisibility'
import { getRealtimeClient } from '@/lib/realtime/client'

interface UseLiveExamSessionsOptions {
  classId: string
  pollIntervalMs?: number
}

export interface ExamSession {
  id: string
  status: string
  student: {
    id: string
    name: string
    email: string
    studentId: string | null
  }
  bank: {
    id: string
    name: string
    moduleCode: string
    courseCode: string
  }
  startedAt: string | null
  expiresAt: string | null
  submittedAt: string | null
  score: number | null
  totalPoints: number | null
  percentage: number | null
  passed: boolean | null
  timeRemaining: number | null
  answerCount: number
}

export function useLiveExamSessions({
  classId,
  pollIntervalMs = 15_000,
}: UseLiveExamSessionsOptions) {
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sessionsRef = useRef<ExamSession[]>([])

  const updateSession = useCallback((updated: any) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === updated.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], ...updated }
        sessionsRef.current = next
        return next
      }
      return prev
    })
  }, [])

  const insertSession = useCallback((inserted: any) => {
    setSessions((prev) => {
      if (prev.some((s) => s.id === inserted.id)) return prev
      const next = [inserted, ...prev]
      sessionsRef.current = next
      return next
    })
  }, [])

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/instructor/exams/classes/${classId}/sessions`)
      if (!res.ok) {
        if (res.status === 403 || res.status === 404) {
          setSessions([])
          setLoading(false)
          return
        }
        throw new Error(`Failed to fetch sessions: ${res.status}`)
      }
      const data = (await res.json()) as ExamSession[]
      setSessions(data)
      sessionsRef.current = data
      setLoading(false)
      setError(null)
    } catch (err) {
      console.error('[useLiveExamSessions] fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }, [classId])

  const { isLive } = useRealtimeExamMonitor({
    classId,
    onSessionUpdate: updateSession,
    onSessionInsert: insertSession,
    enabled: true,
  })

  const supabase = getRealtimeClient()
  const shouldPoll = !supabase || !isLive

  usePollVisibility({
    intervalMs: pollIntervalMs,
    onTick: fetchSessions,
    enabled: shouldPoll,
  })

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    return () => {
      sessionsRef.current = []
    }
  }, [])

  return {
    sessions,
    loading,
    error,
    isLive,
    refetch: fetchSessions,
  }
}
