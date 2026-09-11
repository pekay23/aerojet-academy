'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2,
  RefreshCcw,
  Eye as _Eye,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send as _Send,
  ChevronDown,
  ChevronRight,
  Flag,
  RotateCcw,
  Megaphone,
  Users,
  Activity,
  Hourglass,
  RefreshCcw as _RefreshCcw,
  ShieldAlert as _ShieldAlert,
  Award as _Award,
  X,
} from 'lucide-react'
import { TableSkeleton } from '@/components/shared/DashboardSkeleton'
import ViolationReviewPanel from './ViolationReviewPanel'
import ConfirmModal from './ConfirmModal'
import type { Violation } from './ViolationReviewPanel'
import { ACADEMIC_RULES } from '@/lib/constants/business-rules'

interface StudentAnswer {
  id: string
  questionId: string
  questionText: string
  questionRef: string | null
  options: string[]
  correctAnswer: string
  selectedAnswer: string | null
  isCorrect: boolean | null
  points: number
  pointsAwarded: number | null
  answeredAt: string | null
}

interface Report {
  id: string
  reason: string
  status: string
  questionId: string | null
  questionRef: string | null
  createdAt: string
}

interface SessionData {
  id: string
  student: { id: string; name: string; email: string; studentId: string | null }
  bank: { id: string; name: string; moduleCode: string | null; courseCode: string }
  status: string
  startedAt: string | null
  expiresAt: string | null
  submittedAt: string | null
  score: number | null
  totalPoints: number | null
  percentage: number | null
  passed: boolean | null
  isPublished: boolean
  autoSubmitted: boolean | null
  voidedAt: string | null
  voidReason: string | null
  /** Total answer rows for the session (one per question). Cheap count. */
  answerCount: number
  reports: Report[]
  /** Violation count from the list endpoint — used for the tab badge. */
  violationCount?: number
  /** Full per-question detail — only populated after the row is expanded. */
  answers?: StudentAnswer[]
}

type TabKey = 'live' | 'review' | 'published' | 'voided'

export default function ExamOperations() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('live')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [violationsMap, setViolationsMap] = useState<Record<string, Violation[]>>({})
  const [violationsLoadingMap, setViolationsLoadingMap] = useState<Set<string>>(new Set())
  const [sessionErrorMap, setSessionErrorMap] = useState<Record<string, string | null>>({})

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    variant: 'danger' | 'warning' | 'info'
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    variant: 'info',
    onConfirm: () => {},
  })

  const [editGradeState, setEditGradeState] = useState<{
    open: boolean
    sessionId: string | null
    score: string
    percentage: string
    passed: boolean
    totalPoints: number | null
  }>({
    open: false,
    sessionId: null,
    score: '',
    percentage: '',
    passed: false,
    totalPoints: null,
  })

  const fetchSessions = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/staff/exams/internal/operations/sessions')
      const json = await res.json()
      if (json.success && json.data) {
        setSessions(json.data)
      } else {
        setError(json.error || 'Failed to load sessions')
      }
    } catch (err) {
      console.error('[ExamOperations] Failed to fetch session detail:', err)
      setError('Failed to load session detail')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessions()
  }, [fetchSessions])

  // Auto-refresh on the Live tab. Polls every 30s while the tab is visible
  // and pauses entirely when the admin's browser tab is hidden — same
  // pattern as `<Heartbeat>`. The slim list endpoint makes a 30s cadence
  // cheap even with several admins on the page.
  useEffect(() => {
    if (activeTab !== 'live') return
    let interval: ReturnType<typeof setInterval> | null = null
    const start = () => {
      if (interval != null) return
      interval = setInterval(fetchSessions, 30_000)
    }
    const stop = () => {
      if (interval != null) {
        clearInterval(interval)
        interval = null
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchSessions() // immediate refresh on return
        start()
      } else {
        stop()
      }
    }
    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [activeTab, fetchSessions])

  // Lazy-fetch full answer detail for one session. The list endpoint
  // returns only counts + reports to keep the page payload small; this
  // is called the first time an admin expands a row.
  const fetchSessionDetail = useCallback(async (sessionId: string) => {
    setSessionErrorMap((prev) => ({ ...prev, [sessionId]: null }))
    try {
      const res = await fetch(`/api/staff/exams/internal/operations/sessions/${sessionId}`)
      const json = await res.json()
      if (!json.success || !json.data) {
        const msg = json.error || 'Failed to load session detail'
        setSessionErrorMap((prev) => ({ ...prev, [sessionId]: msg }))
        return
      }
      const detail = json.data as SessionData
      setSessions((prev) => prev.map((row) => (row.id === sessionId ? { ...row, ...detail } : row)))
    } catch (err) {
      console.error('[ExamOperations] Failed to fetch session detail:', err)
      setSessionErrorMap((prev) => ({ ...prev, [sessionId]: 'Failed to load session detail' }))
    }
  }, [])

  const fetchViolations = useCallback(async (sessionId: string) => {
    setViolationsLoadingMap((prev) => new Set([...prev, sessionId]))
    try {
      const res = await fetch(
        `/api/staff/exams/internal/sessions/${sessionId}/violations?limit=100`
      )
      const json = await res.json()
      if (json.success && json.data) {
        setViolationsMap((prev) => ({ ...prev, [sessionId]: json.data }))
      } else {
        setViolationsMap((prev) => ({ ...prev, [sessionId]: [] }))
      }
    } catch {
      setViolationsMap((prev) => ({ ...prev, [sessionId]: [] }))
    } finally {
      setViolationsLoadingMap((prev) => {
        const next = new Set(prev)
        next.delete(sessionId)
        return next
      })
    }
  }, [])

  const handleExpand = (sessionId: string) => {
    setExpandedSession((cur) => {
      const next = cur === sessionId ? null : sessionId
      if (next) {
        const row = sessions.find((s) => s.id === next)
        if (row && !row.answers) void fetchSessionDetail(next)
        if (row && !violationsMap[next]) void fetchViolations(next)
      }
      return next
    })
  }

  const handleVoid = async (sessionId: string) => {
    setConfirmState({
      open: true,
      title: 'Void this session?',
      description: 'The student will be able to retake the exam. This action cannot be undone.',
      confirmLabel: 'Void & Allow Retake',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }))
        setActionLoading(sessionId)
        try {
          const res = await fetch('/api/staff/exams/internal/operations/void', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, reason: 'Admin-initiated reset' }),
          })
          const json = await res.json()
          if (json.success) {
            setSuccessMsg('Session voided. Student can now retake.')
            setTimeout(() => setSuccessMsg(null), 4000)
            fetchSessions()
          } else {
            setError(json.error || 'Failed to void session')
          }
        } catch {
          setError('Action failed')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  const handlePublish = async (sessionIds: string[]) => {
    setActionLoading(sessionIds[0])
    try {
      const res = await fetch('/api/staff/exams/internal/operations/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg(`Published ${json.data.published} result(s) to students.`)
        setTimeout(() => setSuccessMsg(null), 4000)
        fetchSessions()
      } else {
        setError(json.error || 'Failed to publish')
      }
    } catch {
      setError('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePublishAll = async () => {
    const pending = filteredSessions('review')
    if (pending.length === 0) return
    setConfirmState({
      open: true,
      title: `Publish ${pending.length} result(s)?`,
      description:
        'This will make exam results visible to all pending students. This action cannot be undone.',
      confirmLabel: 'Publish All',
      variant: 'info',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }))
        handlePublish(pending.map((s) => s.id))
      },
    })
  }

  const handleRegrade = async (sessionId: string) => {
    setConfirmState({
      open: true,
      title: 'Recalculate Score?',
      description: 'This will recalculate the score against the current question bank answers.',
      confirmLabel: 'Recalculate',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }))
        setActionLoading(sessionId)
        try {
          const res = await fetch('/api/staff/exams/internal/operations/regrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionIds: [sessionId] }),
          })
          const json = await res.json()
          if (json.success) {
            const detail = json.data.details?.[0]
            if (detail?.changed) {
              setSuccessMsg(`Recalculated: ${detail.oldPct}% → ${detail.newPct}%`)
            } else {
              setSuccessMsg('Recalculated — no score change.')
            }
            setTimeout(() => setSuccessMsg(null), 5000)
            fetchSessions()
          } else {
            setError(json.error || 'Failed to recalculate score')
          }
        } catch {
          setError('Score recalculation failed')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  const handleEditGrade = (session: SessionData) => {
    setEditGradeState({
      open: true,
      sessionId: session.id,
      score: String(session.score ?? ''),
      percentage: String(session.percentage ?? ''),
      passed: session.passed ?? false,
      totalPoints: session.totalPoints ?? null,
    })
  }

  const handleSaveEditGrade = async () => {
    if (!editGradeState.sessionId) return
    const score = Number(editGradeState.score)
    const percentage = Number(editGradeState.percentage)
    if (isNaN(score) || isNaN(percentage)) {
      setError('Score and percentage must be valid numbers')
      return
    }
    if (editGradeState.totalPoints != null && editGradeState.totalPoints > 0) {
      const expectedPct = Math.round((score / editGradeState.totalPoints) * 100)
      if (Math.abs(expectedPct - percentage) > 15) {
        setError(
          `Percentage (${percentage}%) is inconsistent with score (${score}/${editGradeState.totalPoints} ≈ ${expectedPct}%)`
        )
        return
      }
    }
    setActionLoading(editGradeState.sessionId)
    setEditGradeState((prev) => ({ ...prev, open: false }))
    try {
      const res = await fetch(`/api/staff/exams/internal/sessions/${editGradeState.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, percentage, passed: editGradeState.passed }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccessMsg('Grade updated successfully')
        setTimeout(() => setSuccessMsg(null), 5000)
        fetchSessions()
      } else {
        setError(json.error || 'Failed to update grade')
      }
    } catch {
      setError('Failed to update grade')
    } finally {
      setActionLoading(null)
    }
  }

  const _handleExtend = async (sessionId: string) => {
    setConfirmState({
      open: true,
      title: 'Extend exam time?',
      description: "This will add extra time to the student's exam session.",
      confirmLabel: 'Extend',
      variant: 'info',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }))
        setActionLoading(sessionId)
        try {
          const res = await fetch(`/api/staff/exams/internal/sessions/${sessionId}/extend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ minutes: 5 }),
          })
          const json = await res.json()
          if (json.success) {
            setSuccessMsg('Time extended by 5 minutes')
            setTimeout(() => setSuccessMsg(null), 4000)
            fetchSessions()
          } else {
            setError(json.error || 'Failed to extend time')
          }
        } catch {
          setError('Action failed')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  const _handleForceSubmit = async (sessionId: string) => {
    setConfirmState({
      open: true,
      title: 'Force submit this exam?',
      description:
        'This will immediately submit the exam with whatever answers the student has saved.',
      confirmLabel: 'Force Submit',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }))
        setActionLoading(sessionId)
        try {
          const res = await fetch(`/api/staff/exams/internal/sessions/${sessionId}/force-submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          const json = await res.json()
          if (json.success) {
            setSuccessMsg('Exam force-submitted')
            setTimeout(() => setSuccessMsg(null), 4000)
            fetchSessions()
          } else {
            setError(json.error || 'Failed to force submit')
          }
        } catch {
          setError('Action failed')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  const _handleEndSession = async (sessionId: string) => {
    setConfirmState({
      open: true,
      title: 'End this exam session?',
      description: 'This will immediately end the session and auto-submit any saved answers.',
      confirmLabel: 'End Session',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }))
        setActionLoading(sessionId)
        try {
          const res = await fetch(`/api/staff/exams/internal/sessions/${sessionId}/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          const json = await res.json()
          if (json.success) {
            setSuccessMsg('Session ended')
            setTimeout(() => setSuccessMsg(null), 4000)
            fetchSessions()
          } else {
            setError(json.error || 'Failed to end session')
          }
        } catch {
          setError('Action failed')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }

  const filteredSessions = (tab: TabKey): SessionData[] => {
    switch (tab) {
      case 'live':
        return sessions.filter((s) => s.status === 'IN_PROGRESS')
      case 'review':
        return sessions.filter(
          (s) => (s.status === 'COMPLETED' || s.status === 'TIMED_OUT') && !s.isPublished
        )
      case 'published':
        return sessions.filter((s) => s.isPublished)
      case 'voided':
        return sessions.filter((s) => s.status === 'VOIDED')
      default:
        return sessions
    }
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number }[] = [
    {
      key: 'live',
      label: 'Live',
      icon: <Activity className="h-4 w-4" />,
      count: filteredSessions('live').length,
    },
    {
      key: 'review',
      label: 'Pending Review',
      icon: <Hourglass className="h-4 w-4" />,
      count: filteredSessions('review').length,
    },
    {
      key: 'published',
      label: 'Published',
      icon: <CheckCircle2 className="h-4 w-4" />,
      count: filteredSessions('published').length,
    },
    {
      key: 'voided',
      label: 'Voided',
      icon: <XCircle className="h-4 w-4" />,
      count: filteredSessions('voided').length,
    },
  ]

  const currentSessions = filteredSessions(activeTab)

  const getScoreColor = (pct: number | null) => {
    if (pct === null) return 'text-slate-400'
    if (pct >= ACADEMIC_RULES.GRADE_THRESHOLD_PASS) return 'text-green-600 dark:text-green-400'
    if (pct >= ACADEMIC_RULES.GRADE_THRESHOLD_WARNING) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBg = (pct: number | null) => {
    if (pct === null) return 'bg-slate-100 dark:bg-slate-800'
    if (pct >= ACADEMIC_RULES.GRADE_THRESHOLD_PASS)
      return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
    if (pct >= ACADEMIC_RULES.GRADE_THRESHOLD_WARNING)
      return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
    return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="text-aerojet-blue h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Exam Operations</h2>
            <p className="text-sm text-slate-500">
              Monitor live exams, review results, and manage student sessions.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchSessions}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </button>
            {activeTab === 'review' && filteredSessions('review').length > 0 && (
              <button
                onClick={handlePublishAll}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700"
              >
                <Megaphone className="h-3.5 w-3.5" />
                Publish All ({filteredSessions('review').length})
              </button>
            )}
          </div>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.key
                      ? tab.key === 'live'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Live indicator */}
        {activeTab === 'live' && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            Auto-refreshing every 15 seconds
          </div>
        )}

        {/* Sessions List */}
        {currentSessions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-500">No sessions in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentSessions.map((session) => {
              const isExpanded = expandedSession === session.id
              // Counts available without fetching answer detail; the detailed
              // per-question breakdown lives in `session.answers` once the row
              // has been expanded at least once.
              const answeredCount = session.answers
                ? session.answers.filter((a) => a.selectedAnswer !== null).length
                : null
              const totalQuestions = session.answerCount
              const hasReports = session.reports.length > 0
              const pendingReports = session.reports.filter((r) => r.status === 'PENDING')

              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Session Header */}
                  <button
                    onClick={() => handleExpand(session.id)}
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    {/* Score Badge */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${getScoreBg(session.percentage)}`}
                    >
                      <span className={getScoreColor(session.percentage)}>
                        {session.percentage !== null ? `${session.percentage}%` : '—'}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-bold text-slate-900 dark:text-white">
                          {session.student.name}
                        </span>
                        {hasReports && (
                          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            <Flag className="mr-0.5 inline h-2.5 w-2.5" />
                            {pendingReports.length > 0 ? pendingReports.length : 'reported'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {session.bank.courseCode} · {session.bank.moduleCode || session.bank.name}
                        {session.student.studentId && ` · ${session.student.studentId}`}
                        {session.status === 'IN_PROGRESS' &&
                          (answeredCount !== null
                            ? ` · ${answeredCount}/${totalQuestions} answered`
                            : ` · ${totalQuestions} questions`)}
                      </p>
                    </div>

                    {/* Status / Time */}
                    <div className="hidden text-right sm:block">
                      {session.status === 'IN_PROGRESS' && session.expiresAt && (
                        <div className="text-xs font-bold text-green-600">
                          <Clock className="mr-1 inline h-3 w-3" />
                          Expires {new Date(session.expiresAt).toLocaleTimeString()}
                        </div>
                      )}
                      {session.submittedAt && (
                        <div className="text-xs text-slate-400">
                          Submitted {new Date(session.submittedAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Expand chevron */}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      {/* Reports */}
                      {hasReports && (
                        <div className="mb-4">
                          <h4 className="mb-2 text-xs font-bold tracking-widest text-red-500 uppercase">
                            Student Reports ({session.reports.length})
                          </h4>
                          <div className="space-y-2">
                            {session.reports.map((report) => (
                              <div
                                key={report.id}
                                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900/50 dark:bg-red-900/10"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    {report.questionRef && (
                                      <span className="mb-1 inline-block rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-600 dark:bg-red-800/40 dark:text-red-300">
                                        Q: {report.questionRef}
                                      </span>
                                    )}
                                    {report.questionId && !report.questionRef && (
                                      <span className="mb-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-800/40 dark:text-red-300">
                                        Question Report
                                      </span>
                                    )}
                                    <p className="text-red-800 dark:text-red-200">
                                      {report.reason}
                                    </p>
                                  </div>
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                      report.status === 'PENDING'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}
                                  >
                                    {report.status}
                                  </span>
                                </div>
                                <p className="mt-1 text-[10px] text-red-400">
                                  {new Date(report.createdAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Summary stats */}
                      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-lg font-black text-slate-900 dark:text-white">
                            {session.score ?? '—'}
                          </p>
                          <p className="text-[10px] text-slate-500">Score</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-lg font-black text-slate-900 dark:text-white">
                            {session.totalPoints ?? '—'}
                          </p>
                          <p className="text-[10px] text-slate-500">Total Points</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
                          <p className={`text-lg font-black ${getScoreColor(session.percentage)}`}>
                            {session.percentage ?? '—'}%
                          </p>
                          <p className="text-[10px] text-slate-500">Percentage</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
                          <p
                            className={`text-lg font-black ${session.passed ? 'text-green-600' : session.passed === false ? 'text-red-600' : 'text-slate-400'}`}
                          >
                            {session.passed === null ? '—' : session.passed ? 'PASS' : 'FAIL'}
                          </p>
                          <p className="text-[10px] text-slate-500">Result</p>
                        </div>
                      </div>

                      {/* Answer detail table — answers are lazy-loaded on
                        first expand; show a skeleton until they arrive. */}
                      <div className="mb-4 overflow-x-auto">
                        <h4 className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                          Answers
                        </h4>
                        {sessionErrorMap[session.id] ? (
                          <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
                            <AlertTriangle className="mb-2 h-8 w-8 text-red-500" />
                            <p className="text-sm font-bold text-red-700 dark:text-red-300">
                              {sessionErrorMap[session.id]}
                            </p>
                            <button
                              onClick={() => void fetchSessionDetail(session.id)}
                              className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                            >
                              <RefreshCcw className="h-3 w-3" />
                              Retry
                            </button>
                          </div>
                        ) : !session.answers ? (
                          <div className="space-y-1.5">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div
                                key={i}
                                className="h-7 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800/60"
                              />
                            ))}
                          </div>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="px-2 py-1.5 text-left font-bold text-slate-400">
                                  #
                                </th>
                                <th className="px-2 py-1.5 text-left font-bold text-slate-400">
                                  Ref
                                </th>
                                <th className="px-2 py-1.5 text-left font-bold text-slate-400">
                                  Question
                                </th>
                                <th className="px-2 py-1.5 text-left font-bold text-slate-400">
                                  Student Answer
                                </th>
                                <th className="px-2 py-1.5 text-left font-bold text-slate-400">
                                  Correct
                                </th>
                                <th className="px-2 py-1.5 text-center font-bold text-slate-400">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {session.answers.map((ans, idx) => (
                                <tr
                                  key={ans.id}
                                  className="border-b border-slate-100 dark:border-slate-800"
                                >
                                  <td className="px-2 py-1.5 text-slate-500">{idx + 1}</td>
                                  <td className="px-2 py-1.5 font-mono text-slate-500">
                                    {ans.questionRef || '—'}
                                  </td>
                                  <td className="max-w-[200px] truncate px-2 py-1.5 text-slate-700 dark:text-slate-300">
                                    {ans.questionText}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <span
                                      className={
                                        ans.selectedAnswer
                                          ? 'text-slate-900 dark:text-white'
                                          : 'text-slate-400 italic'
                                      }
                                    >
                                      {ans.selectedAnswer || 'No answer'}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1.5 text-slate-500">
                                    {ans.correctAnswer}
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    {ans.isCorrect === null ? (
                                      <span className="text-slate-400">—</span>
                                    ) : ans.isCorrect ? (
                                      <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="mx-auto h-4 w-4 text-red-400" />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Violations panel (only shown when there are violations) */}
                      {(session.violationCount ?? 0) > 0 && (
                        <div className="mb-4">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                              Violations
                            </h4>
                          </div>
                          {violationsLoadingMap.has(session.id) ? (
                            <TableSkeleton rows={4} />
                          ) : (
                            <ViolationReviewPanel
                              sessionId={session.id}
                              violations={violationsMap[session.id] ?? []}
                            />
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {(session.status === 'COMPLETED' ||
                          session.status === 'TIMED_OUT' ||
                          session.status === 'IN_PROGRESS') && (
                          <button
                            onClick={() => handleVoid(session.id)}
                            disabled={actionLoading === session.id}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                          >
                            {actionLoading === session.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Void & Allow Retake
                          </button>
                        )}
                        {(session.status === 'COMPLETED' || session.status === 'TIMED_OUT') &&
                          !session.isPublished && (
                            <button
                              onClick={() => {
                                setConfirmState({
                                  open: true,
                                  title: 'Publish this result?',
                                  description:
                                    'This will make the exam result visible to the student. This action cannot be undone.',
                                  confirmLabel: 'Publish',
                                  variant: 'info',
                                  onConfirm: async () => {
                                    setConfirmState((prev) => ({ ...prev, open: false }))
                                    handlePublish([session.id])
                                  },
                                })
                              }}
                              disabled={actionLoading === session.id}
                              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {actionLoading === session.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Megaphone className="h-3 w-3" />
                              )}
                              Publish Results
                            </button>
                          )}
                        {(session.status === 'COMPLETED' || session.status === 'TIMED_OUT') &&
                          !session.isPublished && (
                            <button
                              onClick={() => handleEditGrade(session)}
                              disabled={actionLoading === session.id}
                              className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 disabled:opacity-50 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                            >
                              {actionLoading === session.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCcw className="h-3 w-3" />
                              )}
                              Edit Grade
                            </button>
                          )}
                        {(session.status === 'COMPLETED' || session.status === 'TIMED_OUT') &&
                          !session.isPublished && (
                            <button
                              onClick={() => handleRegrade(session.id)}
                              disabled={actionLoading === session.id}
                              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                            >
                              {actionLoading === session.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCcw className="h-3 w-3" />
                              )}
                              Recalculate Score
                            </button>
                          )}
                        {session.isPublished && (
                          <span className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700 dark:bg-green-900/20 dark:text-green-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Published
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Grade Modal */}
      {editGradeState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop:blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Grade</h3>
              <button
                onClick={() => setEditGradeState((prev) => ({ ...prev, open: false }))}
                disabled={actionLoading !== null}
                aria-label="Close dialog"
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Manually adjust the grade for this session. This will override the calculated score.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Score</label>
                <input
                  type="number"
                  value={editGradeState.score}
                  onChange={(e) =>
                    setEditGradeState((prev) => ({ ...prev, score: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Percentage (%)</label>
                <input
                  type="number"
                  value={editGradeState.percentage}
                  onChange={(e) =>
                    setEditGradeState((prev) => ({ ...prev, percentage: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  min="0"
                  max="100"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-passed"
                  checked={editGradeState.passed}
                  onChange={(e) =>
                    setEditGradeState((prev) => ({ ...prev, passed: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label
                  htmlFor="edit-passed"
                  className="text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  Passed
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditGradeState((prev) => ({ ...prev, open: false }))}
                disabled={actionLoading !== null}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditGrade}
                disabled={actionLoading !== null}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Save Grade
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        loading={actionLoading !== null}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />
    </>
  )
}
