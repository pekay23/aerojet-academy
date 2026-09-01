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
  History,
  Edit3,
  X,
  Clock,
  Plus,
  Archive,
} from 'lucide-react'
import ApprovalQueue from './ApprovalQueue'
import Link from 'next/link'

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
  pendingCount: number
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

  const [editingRulesBankId, setEditingRulesBankId] = useState<string | null>(null)
  const [rulesForm, setRulesForm] = useState({
    passMarkPct: 75,
    timePerQuestionSecs: 75,
    retakeWaitDays: 90,
    maxRetakes: 3,
    completionWindowYears: 10,
    allowKeyboardAutoSubmit: true,
    customInstructions: '',
    mcqCount: 40,
  })
  const [rulesSaving, setRulesSaving] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    courseId: '',
    moduleCode: '',
    mcqCount: 40,
    ruleSet: 'EASA' as 'EASA' | 'CUSTOM',
  })
  const [createSaving, setCreateSaving] = useState(false)
  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([])
  const [modules, setModules] = useState<{ code: string; name: string }[]>([])
  const [retiringBankId, setRetiringBankId] = useState<string | null>(null)

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

  const retireBank = async (bankId: string) => {
    if (!confirm('Retire this bank? It will no longer be available for exams but existing sessions will be preserved.')) return
    try {
      await fetch(`/api/staff/exams/internal/banks/${bankId}/retire`, { method: 'POST' })
      fetchBanks()
    } finally {
      setRetiringBankId(null)
    }
  }

  const totalQuestions = banks.reduce((s, b) => s + b._count.questions, 0)
  const totalSessions = banks.reduce((s, b) => s + b._count.sessions, 0)
  const healthyCounts = { GREEN: 0, AMBER: 0, RED: 0 }
  banks.forEach(b => healthyCounts[b.poolHealth.health]++)

  useEffect(() => {
    if (showCreateModal && courses.length === 0) {
      fetch('/api/staff/courses?limit=100')
        .then((r) => r.json())
        .then((j) => {
          if (j.data) setCourses(j.data)
        })
        .catch(() => {})
    }
  }, [showCreateModal, courses.length])

  useEffect(() => {
    if (createForm.courseId) {
      fetch(`/api/staff/courses/${createForm.courseId}/exam-components`)
        .then((r) => r.json())
        .then((j) => {
          if (j.data) setModules(j.data)
        })
        .catch(() => setModules([]))
    } else {
      setModules([])
    }
  }, [createForm.courseId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  return (
    <>
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

      {/* Create Bank Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        Create New Bank
      </button>

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
                    {bank.pendingCount > 0 && (
                      <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                        {bank.pendingCount} Pending
                      </span>
                    )}
                    <span className="hidden sm:inline text-xs text-slate-400">{bank._count.sessions} sessions</span>
                    <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 p-5 dark:border-slate-800">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <Link
                        href={`/staff/exams/internal/banks/${bank.id}/questions`}
                        className="inline-flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        <FileQuestion className="h-3 w-3" />
                        Manage Questions
                      </Link>
                      <Link
                        href={`/staff/exams/internal/banks/${bank.id}/schedule`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        Schedule Exam
                      </Link>
                      <Link
                        href={`/staff/exams/internal/banks/${bank.id}/instructors`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        Assign Instructors
                      </Link>
                    </div>
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
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Rules</h4>
                          <button
                            onClick={() => {
                              setEditingRulesBankId(bank.id)
                              setRulesForm({
                                passMarkPct: bank.ruleOverride?.passMarkPct ?? 75,
                                timePerQuestionSecs: bank.ruleOverride?.timePerQuestionSecs ?? 75,
                                retakeWaitDays: bank.ruleOverride?.retakeWaitDays ?? 90,
                                maxRetakes: bank.ruleOverride?.maxRetakes ?? 3,
                                completionWindowYears: bank.ruleOverride?.completionWindowYears ?? 10,
                                allowKeyboardAutoSubmit: bank.ruleOverride?.allowKeyboardAutoSubmit ?? true,
                                customInstructions: bank.ruleOverride?.customInstructions ?? '',
                                mcqCount: bank.mcqCount,
                              })
                            }}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </button>
                        </div>
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
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copiedId === bank.id ? 'Copied' : 'Copy Link'}
                          </button>
                        </div>
                      </div>
                      
                      {bank.pendingCount > 0 && (
                        <div className="sm:col-span-2 mt-4">
                          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Pending Review ({bank.pendingCount})</h4>
                          <ApprovalQueue bankId={bank.id} />
                        </div>
                      )}

                      <div className="sm:col-span-2 mt-4 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                        <button
                          onClick={() => retireBank(bank.id)}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Archive className="h-3 w-3" />
                          Retire Bank
                        </button>
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

    {/* Rules Editing Modal */}
    {editingRulesBankId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Exam Rules</h3>
            <button
              onClick={() => setEditingRulesBankId(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Configure exam rules. EASA standard is 75s/question — reduce to sharpen students for final exams.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Questions per exam
              </label>
              <input
                type="number"
                min={5}
                max={200}
                value={rulesForm.mcqCount}
                onChange={(e) => setRulesForm({ ...rulesForm, mcqCount: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Time per question (seconds)
              </label>
              <input
                type="number"
                min={10}
                max={300}
                value={rulesForm.timePerQuestionSecs}
                onChange={(e) => setRulesForm({ ...rulesForm, timePerQuestionSecs: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-slate-400">EASA standard: 75s. Lower = more challenging.</p>
            </div>

            <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/10">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Total Exam Duration</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {Math.round((rulesForm.timePerQuestionSecs * rulesForm.mcqCount) / 60)} minutes
                  </p>
                  <p className="text-xs text-slate-500">
                    {rulesForm.mcqCount} questions × {rulesForm.timePerQuestionSecs} seconds
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Pass mark (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={rulesForm.passMarkPct}
                onChange={(e) => setRulesForm({ ...rulesForm, passMarkPct: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Retake wait (days)
              </label>
              <input
                type="number"
                min={0}
                max={365}
                value={rulesForm.retakeWaitDays}
                onChange={(e) => setRulesForm({ ...rulesForm, retakeWaitDays: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Max attempts
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={rulesForm.maxRetakes}
                onChange={(e) => setRulesForm({ ...rulesForm, maxRetakes: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={rulesForm.allowKeyboardAutoSubmit}
                  onChange={(e) => setRulesForm({ ...rulesForm, allowKeyboardAutoSubmit: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Allow keyboard auto-submit (any key press submits exam)
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setEditingRulesBankId(null)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setRulesSaving(true)
                try {
                  const res = await fetch(`/api/staff/exams/internal/banks/${editingRulesBankId}/rule-override`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(rulesForm),
                  })
                  if (res.ok) {
                    setEditingRulesBankId(null)
                    fetchBanks()
                  }
                } finally {
                  setRulesSaving(false)
                }
              }}
              disabled={rulesSaving}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {rulesSaving ? 'Saving...' : 'Save Rules'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Create Bank Modal */}
    {showCreateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Exam Bank</h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Create a new question bank for a course module.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                value={createForm.courseId}
                onChange={(e) => setCreateForm({ ...createForm, courseId: e.target.value, moduleCode: '' })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select a course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Module 1 — Air Law"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Module
              </label>
              <select
                value={createForm.moduleCode}
                onChange={(e) => setCreateForm({ ...createForm, moduleCode: e.target.value })}
                disabled={!createForm.courseId}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select a module...</option>
                {modules.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </select>
              {!createForm.courseId && (
                <p className="mt-1 text-xs text-slate-400">Select a course first to see its modules.</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Questions per exam
              </label>
              <input
                type="number"
                min={1}
                value={createForm.mcqCount}
                onChange={(e) => setCreateForm({ ...createForm, mcqCount: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-slate-400">
                Recommended minimum: {createForm.mcqCount * 5} questions in pool (5× exam size for {createForm.ruleSet} standard).
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Rule Set
              </label>
              <select
                value={createForm.ruleSet}
                onChange={(e) => setCreateForm({ ...createForm, ruleSet: e.target.value as 'EASA' | 'CUSTOM' })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="EASA">EASA (default)</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!createForm.courseId || !createForm.name) return
                setCreateSaving(true)
                try {
                  const res = await fetch('/api/staff/exams/internal/banks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(createForm),
                  })
                  if (res.ok) {
                    setShowCreateModal(false)
                    setCreateForm({ name: '', courseId: '', moduleCode: '', mcqCount: 40, ruleSet: 'EASA' })
                    fetchBanks()
                  }
                } finally {
                  setCreateSaving(false)
                }
              }}
              disabled={createSaving || !createForm.courseId || !createForm.name}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createSaving ? 'Creating...' : 'Create Bank'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
