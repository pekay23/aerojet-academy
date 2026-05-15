'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileQuestion,
  Users,
  BarChart3,
  Copy,
} from 'lucide-react'

type PoolHealth = 'GREEN' | 'AMBER' | 'RED'

interface ExamBank {
  id: string
  name: string
  moduleCode: string | null
  mcqCount: number
  ruleSet: string
  isActive: boolean
  course: { id: string; name: string; code: string }
  _count: { questions: number; sessions: number }
  poolHealth: { health: PoolHealth; questionCount: number; requiredMinimum: number }
  ruleOverride: any | null
}

const HEALTH_CONFIG: Record<PoolHealth, { label: string; color: string; bg: string }> = {
  GREEN: { label: 'Healthy', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/30' },
  AMBER: { label: 'Low', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  RED: { label: 'Critical', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/30' },
}

export default function ExamBankManager() {
  const [banks, setBanks] = useState<ExamBank[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchBanks = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/exams/internal/banks')
      const json = await res.json()
      if (json.data) setBanks(json.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBanks() }, [fetchBanks])

  const copyStudentLink = async (bankId: string) => {
    const path = `/student/exams/internal?bankId=${bankId}`
    const href = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path
    await navigator.clipboard.writeText(href)
    setCopiedId(bankId)
    window.setTimeout(() => setCopiedId(current => current === bankId ? null : current), 1800)
  }

  const totalQuestions = banks.reduce((s, b) => s + b._count.questions, 0)
  const totalSessions = banks.reduce((s, b) => s + b._count.sessions, 0)
  const healthyCounts = { GREEN: 0, AMBER: 0, RED: 0 }
  banks.forEach(b => healthyCounts[b.poolHealth.health]++)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="h-5 w-5 text-aerojet-blue" />
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{banks.length}</p>
          <p className="text-xs text-slate-500">Exam Banks</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <FileQuestion className="h-5 w-5 text-purple-600" />
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalQuestions}</p>
          <p className="text-xs text-slate-500">Total Questions</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <Users className="h-5 w-5 text-cyan-600" />
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalSessions}</p>
          <p className="text-xs text-slate-500">Total Sessions</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <BarChart3 className="h-5 w-5 text-amber-600" />
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            <span className="text-green-600">{healthyCounts.GREEN}</span>
            {' / '}
            <span className="text-amber-600">{healthyCounts.AMBER}</span>
            {' / '}
            <span className="text-red-600">{healthyCounts.RED}</span>
          </p>
          <p className="text-xs text-slate-500">Pool Health (G/A/R)</p>
        </div>
      </div>

      {/* Bank List */}
      {banks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="font-bold text-slate-500">No exam banks created yet.</p>
          <p className="mt-1 text-sm text-slate-400">Create your first question bank to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banks.map(bank => {
            const health = HEALTH_CONFIG[bank.poolHealth.health]
            const expanded = expandedId === bank.id
            const fillPct = Math.min(100, Math.round((bank.poolHealth.questionCount / bank.poolHealth.requiredMinimum) * 100))

            return (
              <div key={bank.id} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <button
                  onClick={() => setExpandedId(expanded ? null : bank.id)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${health.bg}`}>
                      {bank.poolHealth.health === 'GREEN' ? (
                        <CheckCircle2 className={`h-5 w-5 ${health.color}`} />
                      ) : (
                        <AlertTriangle className={`h-5 w-5 ${health.color}`} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{bank.name}</h3>
                      <p className="text-xs text-slate-500">
                        {bank.course.code} • {bank.mcqCount} MCQs • {bank.ruleSet}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${health.bg} ${health.color}`}>
                      {health.label} ({bank.poolHealth.questionCount}/{bank.poolHealth.requiredMinimum})
                    </span>
                    <span className="text-xs text-slate-400">{bank._count.sessions} sessions</span>
                    <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 p-5 dark:border-slate-800">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Pool Health</h4>
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Question Pool</span>
                            <span className="font-bold text-slate-900 dark:text-white">{fillPct}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className={`h-full rounded-full transition-all ${
                                bank.poolHealth.health === 'GREEN' ? 'bg-green-500' :
                                bank.poolHealth.health === 'AMBER' ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {bank.poolHealth.questionCount} questions / {bank.poolHealth.requiredMinimum} required (5× exam size)
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Rules</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Pass Mark</span>
                            <span className="font-medium">{bank.ruleOverride?.passMarkPct ?? 75}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Time/Question</span>
                            <span className="font-medium">{bank.ruleOverride?.timePerQuestionSecs ?? 75}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Retake Wait</span>
                            <span className="font-medium">{bank.ruleOverride?.retakeWaitDays ?? 90} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Max Attempts</span>
                            <span className="font-medium">{bank.ruleOverride?.maxRetakes ?? 3}</span>
                          </div>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Student Access</h4>
                        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Share this link with students enrolled in {bank.course.code}. Portal role and enrollment checks still apply before a student can start.
                          </p>
                          <button
                            type="button"
                            onClick={() => copyStudentLink(bank.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copiedId === bank.id ? 'Copied' : 'Copy Link'}
                          </button>
                        </div>
                      </div>
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
