'use client'

import { useState, useCallback } from 'react'
import {
  Play,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldAlert as _ShieldAlert,
  Send,
  Hourglass,
  Award,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableSkeleton } from '@/components/shared/DashboardSkeleton'
import { useExamMonitor } from '@/hooks/useExamMonitor'
import { cn, formatDateTime } from '@/lib/utils'
import { ACADEMIC_RULES } from '@/lib/constants/business-rules'
import { toast } from 'sonner'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

interface MonitorClassInfo {
  id: string
  name: string
  courseName: string
  courseCode: string
  enrolledCount: number
  startDate: string
  endDate: string
}

interface MonitorSession {
  id: string
  status: string
  student: { id: string; name: string; email: string }
  bank: { id: string; name: string }
  startedAt: string | null
  expiresAt: string | null
  submittedAt: string | null
  score: number | null
  totalPoints: number | null
  percentage: number | null
  passed: boolean | null
  correctCount: number
  timeRemaining: number | null
  answerCount: number
  answers?: {
    question: { id: string; text: string; correctAnswer: string; points: number } | null
    selectedAnswer: string | null
    pointsAwarded: number | null
    isCorrect: boolean | null
    answeredAt: string | null
  }[]
}

type StatusFilter = 'all' | 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT' | 'VOIDED' | 'NOT_STARTED'

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function SessionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    IN_PROGRESS: {
      label: 'Active',
      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      icon: <Clock className="h-3 w-3" />,
    },
    COMPLETED: {
      label: 'Finished',
      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    TIMED_OUT: {
      label: 'Timeout',
      cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      icon: <XCircle className="h-3 w-3" />,
    },
    VOIDED: {
      label: 'Voided',
      cls: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      icon: <AlertCircle className="h-3 w-3" />,
    },
    NOT_STARTED: {
      label: 'Not started',
      cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      icon: <Clock className="h-3 w-3" />,
    },
  }
  const s = map[status] || map.NOT_STARTED
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border-transparent px-2.5 py-0.5 text-xs font-bold',
        s.cls
      )}
    >
      {s.icon}
      {s.label}
    </span>
  )
}

function ScoreBar({ value }: { value: number | null }) {
  const pct = value ?? 0
  const color =
    pct >= ACADEMIC_RULES.GRADE_THRESHOLD_PASS
      ? 'bg-emerald-500'
      : pct >= ACADEMIC_RULES.GRADE_THRESHOLD_WARNING
        ? 'bg-amber-500'
        : 'bg-red-500'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <div
        className={cn('h-full rounded-full transition-all', color)}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  )
}

export default function ClassMonitorPage({
  classId,
  initialClass,
  initialSessions,
}: {
  classId: string
  initialClass: MonitorClassInfo | null
  initialSessions: MonitorSession[]
}) {
  const [sessions, setSessions] = useState<MonitorSession[]>(initialSessions)
  const [loading, _setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [startConfirmOpen, setStartConfirmOpen] = useState(false)
  const [extendModalOpen, setExtendModalOpen] = useState<string | null>(null)
  const [extendMinutes, setExtendMinutes] = useState(5)

  const filteredSessions =
    statusFilter === 'all' ? sessions : sessions.filter((s) => s.status === statusFilter)
  const { items, requestSort, sortConfig } = useSort(filteredSessions, {
    key: 'student.name',
    order: 'asc',
  })

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/instructor/exams/classes/${classId}/monitor`)
      const json = await res.json()
      if (json.success) {
        setSessions((previous) => {
          const previousById = new Map(previous.map((row) => [row.id, row]))
          return json.data.map((row: MonitorSession) => {
            const previousRow = previousById.get(row.id)
            return previousRow && row.answers === undefined
              ? { ...row, answers: previousRow.answers }
              : row
          })
        })
      } else {
        toast.error(json.error || 'Failed to refresh monitor')
      }
    } catch (err) {
      console.error('[ClassMonitorPage] Failed to refresh monitor:', err)
      toast.error('Failed to refresh monitor')
    } finally {
      setRefreshing(false)
    }
  }, [classId])

  useExamMonitor(classId, refresh)

  const activeCount = sessions.filter((s) => s.status === 'IN_PROGRESS').length
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length
  const timeoutCount = sessions.filter((s) => s.status === 'TIMED_OUT').length
  const avgScore =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / sessions.length)
      : 0

  const handleStartExam = async () => {
    setStartConfirmOpen(false)
    setActionLoading('start')
    try {
      const res = await fetch(`/api/instructor/exams/classes/${classId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Exam started: ${json.data.started} students, ${json.data.skipped} skipped`)
        refresh()
      } else {
        toast.error(json.error || 'Failed to start exam')
      }
    } catch (err) {
      console.error('[ClassMonitorPage] Failed to start exam:', err)
      toast.error('Failed to start exam')
    } finally {
      setActionLoading(null)
    }
  }

  const handleVoid = async (sessionId: string) => {
    setActionLoading(`void-${sessionId}`)
    try {
      const res = await fetch(`/api/instructor/exams/classes/${classId}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Session voided')
        refresh()
      } else {
        toast.error(json.error || 'Failed to void session')
      }
    } catch (err) {
      console.error('[ClassMonitorPage] Failed to void session:', err)
      toast.error('Failed to void session')
    } finally {
      setActionLoading(null)
    }
  }

  const handleExtend = async (sessionId: string) => {
    setActionLoading(`extend-${sessionId}`)
    try {
      const res = await fetch(`/api/staff/exams/internal/sessions/${sessionId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: extendMinutes }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Extended by ${extendMinutes} minutes`)
        setExtendModalOpen(null)
        refresh()
      } else {
        toast.error(json.error || 'Failed to extend time')
      }
    } catch (err) {
      console.error('[ClassMonitorPage] Failed to extend time:', err)
      toast.error('Failed to extend time')
    } finally {
      setActionLoading(null)
    }
  }

  const handleForceSubmit = async (sessionId: string) => {
    setActionLoading(`force-${sessionId}`)
    try {
      const res = await fetch(`/api/staff/exams/internal/sessions/${sessionId}/force-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Session force-submitted')
        refresh()
      } else {
        toast.error(json.error || 'Failed to force submit')
      }
    } catch (err) {
      console.error('[ClassMonitorPage] Failed to force submit:', err)
      toast.error('Failed to force submit')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemind = async (sessionId: string) => {
    setActionLoading(`remind-${sessionId}`)
    try {
      const res = await fetch(`/api/instructor/exams/classes/${classId}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Reminder sent')
      } else {
        toast.error(json.error || 'Failed to send reminder')
      }
    } catch (err) {
      console.error('[ClassMonitorPage] Failed to send reminder:', err)
      toast.error('Failed to send reminder')
    } finally {
      setActionLoading(null)
    }
  }

  if (!initialClass) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Internal Exams Disabled
        </h2>
        <p className="max-w-md text-sm text-slate-500">
          The internal exam system is not currently enabled. Contact an administrator.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Live Monitor</h1>
          <p className="mt-1 text-sm text-slate-500">
            {initialClass.name} — {initialClass.courseCode} · {initialClass.enrolledCount} enrolled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => setStartConfirmOpen(true)}
            disabled={actionLoading === 'start'}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {actionLoading === 'start' ? 'Starting...' : 'Start Exam for Class'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Active
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Finished
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{completedCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
              <Hourglass className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Timed Out
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{timeoutCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <Award className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Avg Score
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{avgScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', 'All'],
            ['IN_PROGRESS', 'Active'],
            ['COMPLETED', 'Finished'],
            ['TIMED_OUT', 'Timed Out'],
            ['VOIDED', 'Voided'],
            ['NOT_STARTED', 'Not Started'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key as StatusFilter)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
              statusFilter === key
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Session Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 dark:border-slate-800">
          <CheckCircle2 className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
          <p className="text-sm font-medium text-slate-400">
            No sessions match the current filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <SortHeader
                  label="Student"
                  sortKey="student.name"
                  currentSort={sortConfig}
                  onSort={requestSort}
                  className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
                />
                <SortHeader
                  label="Status"
                  sortKey="status"
                  currentSort={sortConfig}
                  onSort={requestSort}
                  align="center"
                  className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
                />
                <SortHeader
                  label="Progress"
                  sortKey="percentage"
                  currentSort={sortConfig}
                  onSort={requestSort}
                  align="right"
                  className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
                />
                <SortHeader
                  label="Time Left"
                  sortKey="timeRemaining"
                  currentSort={sortConfig}
                  onSort={requestSort}
                  align="right"
                  className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
                />
                <SortHeader
                  label="Score"
                  sortKey="score"
                  currentSort={sortConfig}
                  onSort={requestSort}
                  align="right"
                  className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
                />
                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {items.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  expanded={expandedSession === s.id}
                  onToggle={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                  onVoid={handleVoid}
                  onExtend={(id) => {
                    setExtendModalOpen(id)
                    setExtendMinutes(5)
                  }}
                  onForceSubmit={handleForceSubmit}
                  onRemind={handleRemind}
                  actionLoading={actionLoading}
                  extendModalOpen={extendModalOpen === s.id}
                  extendMinutes={extendMinutes}
                  onExtendMinutesChange={setExtendMinutes}
                  onExtendConfirm={() => handleExtend(s.id)}
                  onExtendCancel={() => setExtendModalOpen(null)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Start Exam Confirmation */}
      <ConfirmDialog
        open={startConfirmOpen}
        onOpenChange={setStartConfirmOpen}
        title="Start Exam for Class"
        description={`This will start the exam for all ${initialClass.enrolledCount} enrolled students in ${initialClass.name}. Each student will receive the full exam duration from when they begin.`}
        confirmLabel="Start Exam"
        variant="default"
        onConfirm={handleStartExam}
      />
    </div>
  )
}

function SessionRow({
  session,
  expanded,
  onToggle,
  onVoid,
  onExtend,
  onForceSubmit,
  onRemind,
  actionLoading,
  extendModalOpen,
  extendMinutes,
  onExtendMinutesChange,
  onExtendConfirm,
  onExtendCancel,
}: {
  session: MonitorSession
  expanded: boolean
  onToggle: () => void
  onVoid: (id: string) => void
  onExtend: (id: string) => void
  onForceSubmit: (id: string) => void
  onRemind: (id: string) => void
  actionLoading: string | null
  extendModalOpen: boolean
  extendMinutes: number
  onExtendMinutesChange: (m: number) => void
  onExtendConfirm: () => void
  onExtendCancel: () => void
}) {
  const isLoading = (action: string) => actionLoading === `${action}-${session.id}`

  return (
    <>
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td className="px-4 py-3">
          <p className="truncate font-medium text-slate-900 dark:text-white">
            {session.student.name}
          </p>
          <p className="truncate text-xs text-slate-500">{session.bank.name}</p>
        </td>
        <td className="px-4 py-3 text-center">
          <SessionStatusBadge status={session.status} />
        </td>
        <td className="w-40 px-4 py-3 tabular-nums">
          <ScoreBar value={session.percentage} />
          <span className="mt-1 block text-xs text-slate-400">
            {session.percentage != null
              ? `${session.percentage}%`
              : `${session.answerCount} answered`}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
          {session.timeRemaining != null ? formatDuration(session.timeRemaining) : '—'}
        </td>
        <td className="px-4 py-3 text-right font-semibold text-slate-700 tabular-nums dark:text-slate-200">
          {session.score != null ? `${session.score}/${session.totalPoints ?? '?'}` : '—'}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center gap-1">
            <button
              onClick={onToggle}
              aria-expanded={expanded}
              aria-controls={`monitor-session-detail-${session.id}`}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Less' : 'More'}
            </button>
            {session.status === 'IN_PROGRESS' && (
              <>
                <button
                  onClick={() => onExtend(session.id)}
                  disabled={isLoading('extend')}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Clock className="h-3 w-3" />
                  Extend
                </button>
                <button
                  onClick={() => onForceSubmit(session.id)}
                  disabled={isLoading('force')}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                  <Send className="h-3 w-3" />
                  Submit
                </button>
              </>
            )}
            {session.status !== 'VOIDED' && session.status !== 'COMPLETED' && (
              <button
                onClick={() => onVoid(session.id)}
                disabled={isLoading('void')}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <XCircle className="h-3 w-3" />
                Void
              </button>
            )}
            {session.status === 'NOT_STARTED' && (
              <button
                onClick={() => onRemind(session.id)}
                disabled={isLoading('remind')}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Send className="h-3 w-3" />
                Remind
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr id={`monitor-session-detail-${session.id}`}>
          <td colSpan={6} className="bg-slate-50 px-4 py-4 dark:bg-slate-800/30">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500">Session Detail</p>
              <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3 dark:text-slate-400">
                <span>Started: {session.startedAt ? formatDateTime(session.startedAt) : '—'}</span>
                <span>Expires: {session.expiresAt ? formatDateTime(session.expiresAt) : '—'}</span>
                <span>
                  Submitted: {session.submittedAt ? formatDateTime(session.submittedAt) : '—'}
                </span>
                <span>Correct: {session.correctCount}</span>
                <span>Answers: {session.answerCount}</span>
                <span>Passed: {session.passed == null ? '—' : session.passed ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {session.answers !== undefined && (
              <div className="mt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Submitted Answers</h3>
                {session.answers.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500 italic">
                    No answers were recorded for this session.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {session.answers.map((answer, index) => {
                      const question = answer.question
                      const selected = answer.selectedAnswer ?? 'No answer'
                      const correct = question?.correctAnswer ?? '—'
                      const isCorrect =
                        answer.isCorrect ??
                        (question != null && answer.selectedAnswer === question.correctAnswer)

                      return (
                        <div
                          key={answer.question?.id || `answer-${index}`}
                          className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                Question {index + 1}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                                {question?.text || 'Question text unavailable'}
                              </p>
                            </div>
                            {isCorrect === null ? (
                              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                Unscored
                              </span>
                            ) : isCorrect ? (
                              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                Correct
                              </span>
                            ) : (
                              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                Incorrect
                              </span>
                            )}
                          </div>
                          <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                            <div>
                              <dt className="font-bold text-slate-400">Your answer</dt>
                              <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
                                {selected}
                              </dd>
                            </div>
                            <div>
                              <dt className="font-bold text-slate-400">Correct answer</dt>
                              <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
                                {correct}
                              </dd>
                            </div>
                            <div>
                              <dt className="font-bold text-slate-400">Points</dt>
                              <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
                                {answer.pointsAwarded ?? question?.points ?? '—'}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
      {extendModalOpen && (
        <tr>
          <td colSpan={6} className="bg-blue-50 px-4 py-4 dark:bg-blue-900/10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Extend time by:
              </span>
              {[5, 10, 15, 20, 30].map((m) => (
                <button
                  key={m}
                  onClick={() => onExtendMinutesChange(m)}
                  className={cn(
                    'rounded-lg px-3 py-1 text-xs font-bold',
                    extendMinutes === m
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {m} min
                </button>
              ))}
              <button
                onClick={onExtendConfirm}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
              >
                Confirm
              </button>
              <button
                onClick={onExtendCancel}
                className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
