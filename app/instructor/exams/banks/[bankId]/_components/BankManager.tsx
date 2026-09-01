'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  X,
  Settings,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableSkeleton } from '@/components/shared/DashboardSkeleton'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface BankQuestion {
  id: string
  text: string
  status: string
  difficulty: string
  options: unknown
  correctAnswer: string
  points: number
  createdAt?: string
  submittedBy?: { id: string; name: string | null; profile?: { firstName: string | null; lastName: string | null } | null } | null
}

interface BankManagerProps {
  bankId: string
  bankName: string
  courseName: string
  courseCode?: string
  approvedCount?: number
  requiredMinimum?: number
  pendingCount?: number
  poolHealth?: 'GREEN' | 'AMBER' | 'RED'
  questions: BankQuestion[]
  total: number
  page: number
  limit: number
  disabled: boolean
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }
  return (
    <span className={cn('rounded-full border-transparent px-2.5 py-0.5 text-[10px] font-bold', map[status] || 'bg-slate-100 text-slate-600')}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, string> = {
    EASY: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    MEDIUM: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    HARD: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  }
  return (
    <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase', map[difficulty] || 'bg-slate-100 text-slate-600')}>
      {difficulty}
    </span>
  )
}

export default function BankManager({
  bankId,
  bankName,
  courseName,
  courseCode,
  approvedCount,
  requiredMinimum,
  pendingCount,
  poolHealth,
  questions,
  total,
  page,
  limit,
  disabled,
}: BankManagerProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [durationModalOpen, setDurationModalOpen] = useState(false)
  const [timePerQuestion, setTimePerQuestion] = useState(75)
  const [mcqCount, setMcqCount] = useState(40)
  const [savingDuration, setSavingDuration] = useState(false)

  // Calculate total exam duration
  const totalMinutes = Math.round((timePerQuestion * mcqCount) / 60)

  const handleSaveDuration = async () => {
    setSavingDuration(true)
    try {
      const res = await fetch(`/api/instructor/exams/banks/${bankId}/rule-override`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timePerQuestionSecs: timePerQuestion, mcqCount }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Exam duration updated')
        setDurationModalOpen(false)
      } else {
        toast.error(json.error || 'Failed to update duration')
      }
    } catch {
      toast.error('Failed to update duration')
    } finally {
      setSavingDuration(false)
    }
  }

  const filteredQuestions = questions.filter((q) => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false
    if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{bankName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {courseCode && <span className="font-mono font-bold">{courseCode}</span>} {courseName && `· ${courseName}`}
          </p>
        </div>
        <button
          onClick={() => setDurationModalOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
        >
          <Settings className="h-4 w-4" />
          Exam Settings
        </button>
      </div>

      {/* Pool Health + Duration Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pool Health</p>
          <div className="mt-2 flex items-center gap-2">
            <div className={cn(
              'h-3 w-3 rounded-full',
              poolHealth === 'GREEN' ? 'bg-emerald-500' :
              poolHealth === 'AMBER' ? 'bg-amber-500' : 'bg-red-500'
            )} />
            <span className="text-lg font-black text-slate-900 dark:text-white">{poolHealth}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{approvedCount} / {requiredMinimum} required questions</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pending Review</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{pendingCount ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">questions awaiting approval</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Exam Duration</p>
          <div className="mt-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-black text-slate-900 dark:text-white">{totalMinutes} min</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{mcqCount} questions × {timePerQuestion}s each</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Questions List */}
      {disabled ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500" />
          <p className="text-sm text-slate-500">Internal exams are currently disabled.</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 dark:border-slate-800">
          <CheckCircle2 className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
          <p className="text-sm font-medium text-slate-400">No questions match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800"
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{q.text}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {q.points} pt{q.points !== 1 ? 's' : ''} · {formatDate(q.createdAt || new Date().toISOString())}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <DifficultyBadge difficulty={q.difficulty} />
                <StatusBadge status={q.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Duration Settings Modal */}
      {durationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Exam Settings</h3>
              <button
                onClick={() => setDurationModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Configure the exam duration for <strong>{bankName}</strong>. These settings apply to every student who takes this exam.
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
                  value={mcqCount}
                  onChange={(e) => setMcqCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-xs text-slate-400">Number of questions each student receives</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Time per question (seconds)
                </label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-xs text-slate-400">Seconds allocated per question</p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/10">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Total Exam Duration</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{totalMinutes} minutes</p>
                    <p className="text-xs text-slate-500">{mcqCount} questions × {timePerQuestion} seconds</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-900/10">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Note:</strong> This duration applies to every student taking this exam. Each student gets the full {totalMinutes} minutes from when they personally start. The exam auto-submits when time expires.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDurationModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDuration}
                disabled={savingDuration}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingDuration ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
