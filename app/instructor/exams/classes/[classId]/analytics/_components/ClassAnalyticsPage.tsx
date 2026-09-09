'use client'

import { useState, useCallback, useRef } from 'react'
import { Download, TrendingUp, Award, CheckCircle2, BarChart3, Users } from 'lucide-react'
import { TableSkeleton } from '@/components/shared/DashboardSkeleton'
import { cn, formatDate } from '@/lib/utils'
import { ACADEMIC_RULES } from '@/lib/constants/business-rules'
import { toast } from 'sonner'
import { useVirtualizer } from '@tanstack/react-virtual'

interface AnalyticsSummary {
  totalAttempts: number
  completedSessions: number
  passRate: number
  averageScore: number | null
  completionRate: number
}

interface QuestionStat {
  questionId: string
  text: string
  difficulty: string
  totalAnswers: number
  correctAnswers: number
  correctPct: number
}

interface StudentResult {
  id: string
  student: { id: string; name: string; email: string }
  bank: { id: string; name: string }
  status: string
  score: number | null
  totalPoints: number | null
  percentage: number | null
  passed: boolean | null
  startedAt: string | null
  submittedAt: string | null
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

export default function ClassAnalyticsPage({
  classId,
  className,
  courseCode,
}: {
  classId: string
  className: string
  courseCode: string
}) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([])
  const [students, setStudents] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/instructor/exams/classes/${classId}/analytics?limit=100`)
      const json = await res.json()
      if (json.success) {
        setSummary(json.meta?.summary || null)
        setQuestionStats(json.meta?.questionStats || [])
        setStudents(json.data || [])
      }
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [classId])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/instructor/exams/classes/${classId}/analytics?format=csv`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `class-${classId}-analytics.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  // Load on mount
  useState(() => {
    void load()
  })

  const parentRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: students.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  })

  if (loading) return <TableSkeleton rows={10} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Class Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            {className} — {courseCode}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Attempts
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {summary.totalAttempts}
                </p>
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
                  Completed
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {summary.completedSessions}
                </p>
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
                  Pass Rate
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {summary.passRate}%
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Avg Score
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {summary.averageScore ?? '—'}%
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Users className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Completion
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {summary.completionRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-Question Difficulty Breakdown */}
      {questionStats.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
            Per-Question Difficulty
          </h2>
          <div className="space-y-3">
            {questionStats.map((q, i) => (
              <div key={q.questionId} className="flex items-center gap-4">
                <span className="w-8 text-xs font-bold text-slate-400">Q{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="line-clamp-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {q.text}
                    </p>
                    <span className="ml-2 shrink-0 text-xs font-bold text-slate-500">
                      {q.correctPct}%
                    </span>
                  </div>
                  <ScoreBar value={q.correctPct} />
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                    <span>
                      {q.correctAnswers}/{q.totalAnswers} correct
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 font-bold uppercase',
                        q.difficulty === 'EASY'
                          ? 'bg-green-50 text-green-600'
                          : q.difficulty === 'MEDIUM'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-purple-50 text-purple-600'
                      )}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Virtualized Student Performance Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
          Student Performance
        </h2>
        {students.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No completed sessions yet.</p>
        ) : (
          <>
            {/* Fixed Header */}
            <div className="grid grid-cols-[1fr_1fr_100px_120px_120px_80px_120px] border-b border-slate-100 dark:border-slate-800">
              <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Student</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Bank</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Status</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Score</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Percentage</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Passed</th>
              <th className="py-2 text-xs font-semibold text-slate-500">Submitted</th>
            </div>

            {/* Virtualized Body */}
            <div ref={parentRef} className="h-[400px] overflow-auto">
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const s = students[virtualRow.index]
                  return (
                    <div
                      key={s.id}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="grid grid-cols-[1fr_1fr_100px_120px_120px_80px_120px] items-center border-b border-slate-50 hover:bg-slate-50 dark:divide-slate-800/50 dark:hover:bg-slate-800/30">
                        <div className="py-3 pr-4">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {s.student.name}
                          </p>
                          <p className="text-xs text-slate-400">{s.student.email}</p>
                        </div>
                        <div className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                          {s.bank.name}
                        </div>
                        <div className="py-3 pr-4">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-bold',
                              s.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            )}
                          >
                            {s.status}
                          </span>
                        </div>
                        <div className="py-3 pr-4 font-semibold text-slate-700 dark:text-slate-200">
                          {s.score != null ? `${s.score}/${s.totalPoints ?? '?'}` : '—'}
                        </div>
                        <div className="w-32 py-3 pr-4">
                          <ScoreBar value={s.percentage} />
                          <span className="mt-1 block text-xs text-slate-400">
                            {s.percentage ?? '—'}%
                          </span>
                        </div>
                        <div className="py-3 pr-4">
                          {s.passed == null ? (
                            '—'
                          ) : s.passed ? (
                            <span className="font-bold text-emerald-600">Yes</span>
                          ) : (
                            <span className="font-bold text-red-600">No</span>
                          )}
                        </div>
                        <div className="py-3 text-xs text-slate-500">
                          {s.submittedAt ? formatDate(s.submittedAt) : '—'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
