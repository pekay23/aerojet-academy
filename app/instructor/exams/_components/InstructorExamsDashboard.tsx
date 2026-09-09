'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Library,
  Layers,
  GraduationCap,
  Radio,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  User,
  Hash,
  Sparkles,
  RefreshCw,
  Plus,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableSkeleton } from '@/components/shared/DashboardSkeleton'
import TablePagination from '@/components/shared/TablePagination'
import { cn, formatDate } from '@/lib/utils'
import { ACADEMIC_RULES } from '@/lib/constants/business-rules'
import { toast } from 'sonner'
import { useExamMonitor } from '@/hooks/useExamMonitor'
import { useSort, SortHeader } from '@/lib/hooks/useSort'
import type { ExamsDashboardCounts } from '../page'

// ── Shared types ────────────────────────────────────────────────────────────
interface BankRef {
  id: string
  name: string
}
interface AuthorRef {
  id: string
  name: string | null
  profile?: { firstName: string | null; lastName: string | null } | null
}
interface Question {
  id: string
  text: string
  status: string
  difficulty: string
  bankId: string
  bank?: BankRef | null
  submittedBy?: AuthorRef | null
  createdAt?: string
  subTopic?: string | null
  timesServed?: number
}
interface PoolHealth {
  health: 'GREEN' | 'AMBER' | 'RED'
  questionCount: number
  requiredMinimum: number
}
interface Bank {
  id: string
  name: string
  course?: { id: string; name: string; code: string } | null
  mcqCount?: number
  minimumPoolSize?: number | null
  pendingCount?: number
  questionCount?: number
  poolHealth?: PoolHealth
  /** When true, the row is a placeholder for a module the instructor teaches
   *  that has no bank yet — the UI offers a "Create bank" action. */
  bankless?: boolean
  courseId?: string
}
interface ClassItem {
  id: string
  name: string
  course?: { id: string; name: string; code: string } | null
  enrolledCount: number
  scheduledExamsCount: number
  completionRate: number
  startDate: string
  endDate: string
}
interface ClassSchedule {
  id: string
  bankId: string
  bankName: string
  bankModuleCode: string | null
  bankMcqCount: number | null
  scheduledStart: string | null
  scheduledEnd: string | null
  allowLateStart: boolean
  sebRequired: boolean
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface MonitorAnswer {
  question: { id: string; text: string; correctAnswer: string; points: number }
  selectedAnswer: string | null
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
  answerCount: number
  timeRemaining: number | null
  answers?: MonitorAnswer[]
}

interface Paginated<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

async function fetchPaginated<T>(url: string): Promise<Paginated<T>> {
  const res = await fetch(url, { cache: 'no-store' })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Request failed')
  return { data: json.data, total: json.meta.total, page: json.meta.page, limit: json.meta.limit }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Request failed')
  return json.data as T
}

// ── Small presentational helpers ──────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full border-transparent text-[10px] font-bold',
        map[status] || 'bg-slate-100 text-slate-600'
      )}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, string> = {
    EASY: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    MEDIUM: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    HARD: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  }
  return (
    <span
      className={cn(
        'inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
        map[difficulty] || 'bg-slate-100 text-slate-600'
      )}
    >
      {difficulty}
    </span>
  )
}

/** Percentage bar colour-coded against the EASA / academic pass & warning thresholds. */
function ScoreBar({ value, className }: { value: number | null; className?: string }) {
  const pct = value ?? 0
  const color =
    pct >= ACADEMIC_RULES.GRADE_THRESHOLD_PASS
      ? 'bg-emerald-500'
      : pct >= ACADEMIC_RULES.GRADE_THRESHOLD_WARNING
        ? 'bg-amber-500'
        : 'bg-red-500'
  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700',
        className
      )}
    >
      <div
        className={cn('h-full rounded-full transition-all', color)}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  )
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
    <Badge
      variant="outline"
      className={cn('gap-1 rounded-full border-transparent text-[10px] font-bold', s.cls)}
    >
      {s.icon}
      {s.label}
    </Badge>
  )
}

function authorName(a?: AuthorRef | null) {
  if (!a) return 'Unknown'
  if (a.profile?.firstName || a.profile?.lastName)
    return `${a.profile.firstName || ''} ${a.profile.lastName || ''}`.trim()
  return a.name || 'Unknown'
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── My Questions tab ───────────────────────────────────────────────────────────
function MyQuestionsTab() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchPaginated<Question>(
        `/api/instructor/exams/questions?view=mine&page=${page}&limit=${limit}`
      )
      setQuestions(res.data)
      setTotal(res.total)
    } catch {
      toast.error('Failed to load your questions')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="text-aerojet-sky h-4 w-4" /> My Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={6} />
        ) : questions.length === 0 ? (
          <EmptyState label="You haven't submitted any questions yet." />
        ) : (
          <div className="space-y-2">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => q.bankId && router.push(`/instructor/exams/banks/${q.bankId}`)}
                className="hover:border-aerojet-sky/40 flex w-full items-center justify-between gap-4 rounded-xl border border-slate-100 p-4 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
              >
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {q.text}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{q.bank?.name || 'Unassigned bank'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <DifficultyBadge difficulty={q.difficulty} />
                  <StatusBadge status={q.status} />
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </button>
            ))}
            <TablePagination
              page={page}
              perPage={limit}
              total={total}
              onPageChange={setPage}
              onPerPageChange={setLimit}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── My Banks tab ────────────────────────────────────────────────────────────────
function MyBanksTab() {
  const router = useRouter()
  const [banks, setBanks] = useState<Bank[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchPaginated<Bank>(
        `/api/instructor/exams/banks?scope=mine&page=${page}&limit=${limit}`
      )
      setBanks(res.data)
      setTotal(res.total)
    } catch {
      toast.error('Failed to load your banks')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const healthCls: Record<string, string> = {
    GREEN: 'text-emerald-600',
    AMBER: 'text-amber-600',
    RED: 'text-red-600',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Library className="text-aerojet-sky h-4 w-4" /> My Banks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={6} />
        ) : banks.length === 0 ? (
          <EmptyState label="No question banks are assigned to you yet." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {banks.map((b) => (
              <button
                key={b.id}
                onClick={() => router.push(`/instructor/exams/banks/${b.id}`)}
                className="hover:border-aerojet-sky/40 rounded-2xl border border-slate-100 p-5 text-left transition-all hover:shadow-md dark:border-slate-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.course?.name || '—'}</p>
                  </div>
                  {b.pendingCount ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-amber-200 bg-amber-50 text-amber-700"
                    >
                      {b.pendingCount} review
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  <span>
                    <strong className="text-slate-700 dark:text-slate-200">
                      {b.poolHealth?.questionCount ?? 0}
                    </strong>{' '}
                    approved
                  </span>
                  <span>
                    Pool{' '}
                    <strong className={healthCls[b.poolHealth?.health || 'RED']}>
                      {b.poolHealth?.health ?? 'RED'}
                    </strong>
                  </span>
                </div>
              </button>
            ))}
            <TablePagination
              page={page}
              perPage={limit}
              total={total}
              onPageChange={setPage}
              onPerPageChange={setLimit}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Module Bank tab ─────────────────────────────────────────────────────────────
type QuestionSortKey =
  | 'recent'
  | 'oldest'
  | 'author'
  | 'difficulty_desc'
  | 'difficulty_asc'
  | 'status'
  | 'subtopic'
  | 'served'

const QUESTION_SORT_OPTIONS: { value: QuestionSortKey; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'author', label: 'Author A–Z' },
  { value: 'difficulty_desc', label: 'Difficulty: Hard → Easy' },
  { value: 'difficulty_asc', label: 'Difficulty: Easy → Hard' },
  { value: 'status', label: 'Status' },
  { value: 'subtopic', label: 'Sub-topic' },
  { value: 'served', label: 'Most served' },
]

/** Per-bank question panel — renders inside an expanded module card. */
function BankQuestionPanel({ bankId, instructorId }: { bankId: string; instructorId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<QuestionSortKey>('recent')
  const [author, setAuthor] = useState<'all' | 'me' | 'others'>('all')
  const [status, setStatus] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<string>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort })
      if (status !== 'all') params.set('status', status)
      const res = await fetchJson<Question[]>(
        `/api/instructor/exams/banks/${bankId}/questions?${params.toString()}`
      )
      setQuestions(res)
    } catch {
      toast.error('Failed to load questions for this bank')
    } finally {
      setLoading(false)
    }
  }, [bankId, sort, status])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const visible = useMemo(() => {
    return questions.filter((q) => {
      if (author === 'me' && q.submittedBy?.id !== instructorId) return false
      if (author === 'others' && q.submittedBy?.id === instructorId) return false
      if (difficulty !== 'all' && q.difficulty !== difficulty) return false
      if (search.trim()) {
        const needle = search.trim().toLowerCase()
        if (!q.text.toLowerCase().includes(needle)) return false
      }
      return true
    })
  }, [questions, author, difficulty, search, instructorId])

  return (
    <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as QuestionSortKey)}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={author} onValueChange={(v) => setAuthor(v as typeof author)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All authors</SelectItem>
            <SelectItem value="me">Mine</SelectItem>
            <SelectItem value="others">Others</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulty</SelectItem>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : visible.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">No questions match your filters.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/30">
          {visible.map((q) => (
            <li key={q.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                  {q.text}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {authorName(q.submittedBy)}
                  </span>
                  {q.subTopic ? (
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {q.subTopic}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '—'}
                  </span>
                  {(q.timesServed ?? 0) > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {q.timesServed} served
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <DifficultyBadge difficulty={q.difficulty} />
                <StatusBadge status={q.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ModuleBankTab({ instructorId }: { instructorId: string }) {
  const [banks, setBanks] = useState<Bank[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [creatingFor, setCreatingFor] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchPaginated<Bank>(
        `/api/instructor/exams/banks?scope=module&page=${page}&limit=${limit}`
      )
      setBanks(res.data)
      setTotal(res.total)
    } catch {
      toast.error('Failed to load module banks')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const healthCls: Record<string, string> = {
    GREEN: 'text-emerald-600',
    AMBER: 'text-amber-600',
    RED: 'text-red-600',
  }

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const createBank = async (banklessId: string, courseId: string) => {
    setCreatingFor(banklessId)
    try {
      const course = banks.find((b) => b.courseId === courseId)?.course
      const res = await fetch('/api/instructor/exams/banks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseId,
          name: course ? `${course.code} Module Exam` : 'Module Exam',
          moduleCode: course?.code,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to create bank')
      toast.success('Module bank created')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create bank')
    } finally {
      setCreatingFor(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="text-aerojet-sky h-4 w-4" /> Module Bank
        </CardTitle>
        <p className="mt-1 text-xs text-slate-500">
          One bank per module. Click a module to expand and browse its question bank.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={6} />
        ) : banks.length === 0 ? (
          <EmptyState label="You aren't teaching any modules yet." />
        ) : (
          <div className="space-y-3">
            {banks.map((b) => {
              const isOpen = !!expanded[b.id]
              const health = b.poolHealth?.health || 'RED'
              const isBankless = !!b.bankless
              return (
                <div
                  key={b.id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950/30"
                >
                  <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
                    <button
                      type="button"
                      onClick={() => !isBankless && toggle(b.id)}
                      className={cn(
                        'flex min-w-0 flex-1 items-center gap-3 text-left',
                        isBankless && 'cursor-default'
                      )}
                      disabled={isBankless}
                    >
                      <div className="text-aerojet-sky flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-aerojet-sky text-[10px] font-black tracking-widest uppercase">
                            {b.course?.code}
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {b.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {b.course?.name || 'Module bank'}
                          {isBankless ? ' — no bank yet' : null}
                        </p>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      {b.pendingCount ? (
                        <Badge
                          variant="outline"
                          className="rounded-full border-amber-200 bg-amber-50 text-amber-700"
                        >
                          {b.pendingCount} review
                        </Badge>
                      ) : null}
                      {isBankless ? (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-aerojet-sky h-8 rounded-lg px-3 text-xs"
                          disabled={creatingFor === b.id}
                          onClick={() => createBank(b.id, b.courseId!)}
                        >
                          {creatingFor === b.id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          Create bank
                        </Button>
                      ) : (
                        <>
                          <span className="text-xs text-slate-500">
                            <strong className="text-slate-700 dark:text-slate-200">
                              {b.poolHealth?.questionCount ?? 0}
                            </strong>{' '}
                            approved
                          </span>
                          <span className="text-xs text-slate-500">
                            Pool <strong className={healthCls[health]}>{health}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => toggle(b.id)}
                            aria-label={isOpen ? 'Collapse' : 'Expand'}
                            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                          >
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isOpen && !isBankless ? (
                    <BankQuestionPanel bankId={b.id} instructorId={instructorId} />
                  ) : null}
                </div>
              )
            })}
            <TablePagination
              page={page}
              perPage={limit}
              total={total}
              onPageChange={setPage}
              onPerPageChange={setLimit}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── My Classes tab ──────────────────────────────────────────────────────────────
function MyClassesTab() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchPaginated<ClassItem>(
        `/api/instructor/exams/classes?page=${page}&limit=${limit}`
      )
      setClasses(res.data)
      setTotal(res.total)
    } catch {
      toast.error('Failed to load your classes')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="text-aerojet-sky h-4 w-4" /> My Classes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={6} />
        ) : classes.length === 0 ? (
          <EmptyState label="You aren't teaching any classes yet." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/instructor/exams/classes/${c.id}/monitor`)}
                className="hover:border-aerojet-sky/40 rounded-2xl border border-slate-100 p-5 text-left transition-all hover:shadow-md dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                  <Badge variant="outline" className="rounded-full border-slate-200 text-slate-500">
                    {c.completionRate}% done
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{c.course?.name || '—'}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>
                    <strong className="text-slate-700 dark:text-slate-200">
                      {c.enrolledCount}
                    </strong>{' '}
                    enrolled
                  </span>
                  <span>
                    <strong className="text-slate-700 dark:text-slate-200">
                      {c.scheduledExamsCount}
                    </strong>{' '}
                    scheduled
                  </span>
                  <span>{formatDate(c.startDate)}</span>
                </div>
              </button>
            ))}
            <TablePagination
              page={page}
              perPage={limit}
              total={total}
              onPageChange={setPage}
              onPerPageChange={setLimit}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Class Schedule tab ──────────────────────────────────────────────────────────
function ClassScheduleTab() {
  const router = useRouter()
  const [classes, setClasses] = useState<(ClassItem & { schedules: ClassSchedule[] })[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchPaginated<ClassItem & { schedules: ClassSchedule[] }>(
        `/api/instructor/exams/classes?page=${page}&limit=${limit}`
      )
      setClasses(res.data)
      setTotal(res.total)
    } catch {
      toast.error('Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="text-aerojet-sky h-4 w-4" /> Class Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={6} />
        ) : classes.length === 0 ? (
          <EmptyState label="You aren't teaching any classes yet." />
        ) : (
          <div className="space-y-4">
            {classes.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-100 p-5 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.course?.name || '—'} · {c.enrolledCount} enrolled
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/instructor/exams/classes/${c.id}/monitor`)}
                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300"
                  >
                    Monitor
                  </button>
                </div>
                {c.schedules.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-400">
                    No exams scheduled for this class yet.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {c.schedules.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {s.bankName}{' '}
                            {s.bankModuleCode && (
                              <span className="font-mono text-slate-400">({s.bankModuleCode})</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {s.bankMcqCount} questions · {s.sebRequired ? 'SEB required' : 'No SEB'}
                            {s.allowLateStart && ' · Late start allowed'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {s.scheduledStart ? formatDate(s.scheduledStart) : 'No start'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {s.scheduledStart && s.scheduledEnd
                              ? `${formatTime(s.scheduledStart)} – ${formatTime(s.scheduledEnd)}`
                              : 'Anytime'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <TablePagination
              page={page}
              perPage={limit}
              total={total}
              onPageChange={setPage}
              onPerPageChange={setLimit}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
function LiveMonitorTab() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [sessions, setSessions] = useState<MonitorSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { items, requestSort, sortConfig } = useSort(sessions, {
    key: 'student.name',
    order: 'asc',
  })

  useEffect(() => {
    void fetchPaginated<ClassItem>('/api/instructor/exams/classes?page=1&limit=50')
      .then((res) => {
        setClasses(res.data)
        if (res.data.length > 0) setSelectedClass(res.data[0].id)
      })
      .catch(() => toast.error('Failed to load classes'))
  }, [])

  const refresh = useCallback(async () => {
    if (!selectedClass) return
    setRefreshing(true)
    try {
      const data = await fetchJson<MonitorSession[]>(
        `/api/instructor/exams/classes/${selectedClass}/monitor`
      )
      setSessions(data)
    } catch {
      toast.error('Failed to refresh monitor')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [selectedClass])

  useExamMonitor(selectedClass || null, refresh)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  return (
    <Card data-tour-id="instructor-live-monitor">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="text-aerojet-sky h-4 w-4" /> Live Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClass ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/instructor/exams/classes/${selectedClass}/monitor`)}
              >
                Open full monitor
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={6} />
        ) : !selectedClass ? (
          <EmptyState label="Select a class to monitor live exam sessions." />
        ) : sessions.length === 0 ? (
          <EmptyState label="No exam sessions for this class yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs tracking-wide text-slate-400 uppercase dark:border-slate-800">
                  <SortHeader
                    label="Student"
                    sortKey="student.name"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    className="py-2 pr-4"
                  />
                  <SortHeader
                    label="Status"
                    sortKey="status"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    align="center"
                    className="py-2 pr-4"
                  />
                  <SortHeader
                    label="Progress"
                    sortKey="percentage"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    align="right"
                    className="py-2 pr-4"
                  />
                  <SortHeader
                    label="Time Left"
                    sortKey="timeRemaining"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    align="right"
                    className="py-2 pr-4"
                  />
                  <SortHeader
                    label="Score"
                    sortKey="score"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    align="right"
                    className="py-2"
                  />
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-50 last:border-0 dark:border-slate-800/50"
                  >
                    <td className="py-3 pr-4">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                        {s.student.name}
                      </p>
                      <p className="truncate text-xs text-slate-400">{s.bank.name}</p>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <SessionStatusBadge status={s.status} />
                    </td>
                    <td className="w-40 py-3 pr-4 tabular-nums">
                      <ScoreBar value={s.percentage} />
                      <span className="mt-1 block text-xs text-slate-400">
                        {s.percentage != null ? `${s.percentage}%` : `${s.answerCount} answered`}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-500 tabular-nums">
                      {s.timeRemaining != null ? formatDuration(s.timeRemaining) : '—'}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-700 tabular-nums dark:text-slate-200">
                      {s.score != null ? `${s.score}/${s.totalPoints ?? '?'}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {refreshing ? <p className="mt-2 text-xs text-slate-400">Refreshing…</p> : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 dark:border-slate-800">
      <CheckCircle2 className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
      <p className="text-sm font-medium text-slate-400">{label}</p>
    </div>
  )
}

// ── Main dashboard ───────────────────────────────────────────────────────────────
export default function InstructorExamsDashboard({
  instructorId,
  instructorName,
  internalExamEnabled,
  counts,
}: {
  instructorId: string
  instructorName: string
  internalExamEnabled: boolean
  counts: ExamsDashboardCounts
}) {
  if (!internalExamEnabled) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Internal Exams are disabled
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            The internal exam system is not currently enabled. Contact an administrator to turn it
            on before managing questions, banks, or live sessions.
          </p>
        </CardContent>
      </Card>
    )
  }

  const statCards = [
    { label: 'My Questions', value: counts.myQuestions, icon: BookOpen },
    { label: 'My Banks', value: counts.myBanks, icon: Library },
    { label: 'My Classes', value: counts.myClasses, icon: GraduationCap },
    { label: 'Pending Review', value: counts.pendingReview, icon: AlertCircle },
  ]

  return (
    <div className="space-y-6">
      <div
        data-tour-id="instructor-exams-header"
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Internal Exams</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage question banks, monitor live sessions, and review class performance,{' '}
            {instructorName}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <s.icon className="text-aerojet-sky h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="questions" data-tour-id="instructor-exams-tabs" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-slate-100 p-1 dark:bg-slate-800">
          <TabsTrigger value="questions" className="gap-1.5">
            <BookOpen className="h-4 w-4" />
            My Questions
          </TabsTrigger>
          <TabsTrigger value="banks" className="gap-1.5">
            <Library className="h-4 w-4" />
            My Banks
          </TabsTrigger>
          <TabsTrigger value="module" className="gap-1.5">
            <Layers className="h-4 w-4" />
            Module Bank
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-1.5">
            <GraduationCap className="h-4 w-4" />
            My Classes
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="monitor" className="gap-1.5">
            <Radio className="h-4 w-4" />
            Live Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <MyQuestionsTab />
        </TabsContent>
        <TabsContent value="banks">
          <MyBanksTab />
        </TabsContent>
        <TabsContent value="module">
          <ModuleBankTab instructorId={instructorId} />
        </TabsContent>
        <TabsContent value="classes">
          <MyClassesTab />
        </TabsContent>
        <TabsContent value="schedule">
          <ClassScheduleTab />
        </TabsContent>
        <TabsContent value="monitor">
          <LiveMonitorTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
