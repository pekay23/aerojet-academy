'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2,
  RefreshCw,
  Eye,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  ChevronDown,
  ChevronRight,
  Flag,
  RotateCcw,
  Megaphone,
  Users,
  Activity,
  Hourglass,
} from 'lucide-react'

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
  answers: StudentAnswer[]
  reports: Report[]
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
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  // Auto-refresh every 15s for live tab
  useEffect(() => {
    if (activeTab !== 'live') return
    const iv = setInterval(fetchSessions, 15000)
    return () => clearInterval(iv)
  }, [activeTab, fetchSessions])

  const handleVoid = async (sessionId: string) => {
    if (!confirm('Void this session? The student will be able to retake the exam.')) return
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
    if (!confirm(`Publish results for all ${pending.length} pending session(s)?`)) return
    handlePublish(pending.map(s => s.id))
  }

  const filteredSessions = (tab: TabKey): SessionData[] => {
    switch (tab) {
      case 'live':
        return sessions.filter(s => s.status === 'IN_PROGRESS')
      case 'review':
        return sessions.filter(s => (s.status === 'COMPLETED' || s.status === 'TIMED_OUT') && !s.isPublished)
      case 'published':
        return sessions.filter(s => s.isPublished)
      case 'voided':
        return sessions.filter(s => s.status === 'VOIDED')
      default:
        return sessions
    }
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'live', label: 'Live', icon: <Activity className="h-4 w-4" />, count: filteredSessions('live').length },
    { key: 'review', label: 'Pending Review', icon: <Hourglass className="h-4 w-4" />, count: filteredSessions('review').length },
    { key: 'published', label: 'Published', icon: <CheckCircle2 className="h-4 w-4" />, count: filteredSessions('published').length },
    { key: 'voided', label: 'Voided', icon: <XCircle className="h-4 w-4" />, count: filteredSessions('voided').length },
  ]

  const currentSessions = filteredSessions(activeTab)

  const getScoreColor = (pct: number | null) => {
    if (pct === null) return 'text-slate-400'
    if (pct >= 75) return 'text-green-600 dark:text-green-400'
    if (pct >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBg = (pct: number | null) => {
    if (pct === null) return 'bg-slate-100 dark:bg-slate-800'
    if (pct >= 75) return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
    if (pct >= 50) return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
    return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Exam Operations</h2>
          <p className="text-sm text-slate-500">Monitor live exams, review results, and manage student sessions.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSessions}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
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
        {tabs.map(tab => (
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
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === tab.key
                  ? tab.key === 'live' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}>
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
          {currentSessions.map(session => {
            const isExpanded = expandedSession === session.id
            const answeredCount = session.answers.filter(a => a.selectedAnswer !== null).length
            const totalQuestions = session.answers.length
            const hasReports = session.reports.length > 0
            const pendingReports = session.reports.filter(r => r.status === 'PENDING')

            return (
              <div key={session.id} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {/* Session Header */}
                <button
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  {/* Score Badge */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${getScoreBg(session.percentage)}`}>
                    <span className={getScoreColor(session.percentage)}>
                      {session.percentage !== null ? `${session.percentage}%` : '—'}
                    </span>
                  </div>

                  {/* Student Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-slate-900 dark:text-white">{session.student.name}</span>
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
                      {session.status === 'IN_PROGRESS' && ` · ${answeredCount}/${totalQuestions} answered`}
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
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                    {/* Reports */}
                    {hasReports && (
                      <div className="mb-4">
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-red-500">
                          Student Reports ({session.reports.length})
                        </h4>
                        <div className="space-y-2">
                          {session.reports.map(report => (
                            <div key={report.id} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900/50 dark:bg-red-900/10">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-red-800 dark:text-red-200">{report.reason}</p>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  report.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                }`}>
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
                        <p className="text-lg font-black text-slate-900 dark:text-white">{session.score ?? '—'}</p>
                        <p className="text-[10px] text-slate-500">Score</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
                        <p className="text-lg font-black text-slate-900 dark:text-white">{session.totalPoints ?? '—'}</p>
                        <p className="text-[10px] text-slate-500">Total Points</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
                        <p className={`text-lg font-black ${getScoreColor(session.percentage)}`}>{session.percentage ?? '—'}%</p>
                        <p className="text-[10px] text-slate-500">Percentage</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
                        <p className={`text-lg font-black ${session.passed ? 'text-green-600' : session.passed === false ? 'text-red-600' : 'text-slate-400'}`}>
                          {session.passed === null ? '—' : session.passed ? 'PASS' : 'FAIL'}
                        </p>
                        <p className="text-[10px] text-slate-500">Result</p>
                      </div>
                    </div>

                    {/* Answer detail table */}
                    <div className="mb-4 overflow-x-auto">
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Answers</h4>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="px-2 py-1.5 text-left font-bold text-slate-400">#</th>
                            <th className="px-2 py-1.5 text-left font-bold text-slate-400">Ref</th>
                            <th className="px-2 py-1.5 text-left font-bold text-slate-400">Question</th>
                            <th className="px-2 py-1.5 text-left font-bold text-slate-400">Student Answer</th>
                            <th className="px-2 py-1.5 text-left font-bold text-slate-400">Correct</th>
                            <th className="px-2 py-1.5 text-center font-bold text-slate-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {session.answers.map((ans, idx) => (
                            <tr key={ans.id} className="border-b border-slate-100 dark:border-slate-800">
                              <td className="px-2 py-1.5 text-slate-500">{idx + 1}</td>
                              <td className="px-2 py-1.5 font-mono text-slate-500">{ans.questionRef || '—'}</td>
                              <td className="max-w-[200px] truncate px-2 py-1.5 text-slate-700 dark:text-slate-300">{ans.questionText}</td>
                              <td className="px-2 py-1.5">
                                <span className={ans.selectedAnswer ? 'text-slate-900 dark:text-white' : 'italic text-slate-400'}>
                                  {ans.selectedAnswer || 'No answer'}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-slate-500">{ans.correctAnswer}</td>
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
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {(session.status === 'COMPLETED' || session.status === 'TIMED_OUT' || session.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => handleVoid(session.id)}
                          disabled={actionLoading === session.id}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                        >
                          {actionLoading === session.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                          Void & Allow Retake
                        </button>
                      )}
                      {(session.status === 'COMPLETED' || session.status === 'TIMED_OUT') && !session.isPublished && (
                        <button
                          onClick={() => handlePublish([session.id])}
                          disabled={actionLoading === session.id}
                          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading === session.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Megaphone className="h-3 w-3" />}
                          Publish Results
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
  )
}
