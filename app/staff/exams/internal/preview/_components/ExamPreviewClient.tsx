'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Send,
  XCircle,
  Menu as _Menu,
  X as _X,
  Flag as _Flag,
  Hourglass as _Hourglass,
  Maximize,
  ShieldAlert,
  Bookmark as _Bookmark,
  Clock,
  BarChart3 as _BarChart3,
  RefreshCw,
  ArrowLeft as _ArrowLeft,
  BookOpen,
  Download,
  Lock as _Lock,
  Eye as _Eye,
} from 'lucide-react'


interface BankOption {
  id: string
  name: string
  courseCode: string
  courseName: string
  mcqCount: number
  categoryCode: string | null
  sebConfig: unknown | null
  sebRequired: boolean
}

interface PreviewQuestion {
  index: number
  questionId: string
  text: string
  options: string[]
  correctAnswer: string
  subTopic: string | null
  difficulty: string
  points: number
  syllabusRef: string | null
  knowledgeLevel: number | null
}

interface _BankRules {
  timePerQuestionSecs: number
  passMarkPct: number
  allowKeyboardAutoSubmit: boolean
  customInstructions?: string | null
}

interface PreviewData {
  bank: {
    id: string
    name: string
    course: { code: string; name: string }
    mcqCount: number
    ruleSet: string
    categoryCode: string | null
    sebConfig: unknown | null
    sebRequired: boolean
    bankSebConfig: unknown | null
  }
  config: {
    timePerQuestionSecs: number
    totalTimeSecs: number
    passMarkPct: number
    totalQuestions: number
    poolSize: number
    allowKeyboardAutoSubmit: boolean
    customInstructions: string | null
  }
  subTopics: { topic: string; count: number }[]
  questions: PreviewQuestion[]
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function ExamPreviewClient({ banks }: { banks: BankOption[] }) {
  const [selectedBankId, setSelectedBankId] = useState(banks[0]?.id || '')
  const [data, setData] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<{
    score: number
    correctCount: number
    total: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [_isLeftPanelOpen, _setIsLeftPanelOpen] = useState(true)
  const [_showReport, _setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [_reportSubmitted, setReportSubmitted] = useState(false)
  const [showQuestionReport, setShowQuestionReport] = useState<string | null>(null)
  const [questionReportReason, setQuestionReportReason] = useState('')
  const [questionReportSubmitting, setQuestionReportSubmitting] = useState(false)
  const [_reportedQuestions, setReportedQuestions] = useState<Set<string>>(new Set())
  const [_isFullscreen, setIsFullscreen] = useState(false)
  const [_tabSwitchCount, setTabSwitchCount] = useState(0)
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false)
  const [_flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [_showReviewLaterFilter, _setShowReviewLaterFilter] = useState(false)
  const [_flagging, setFlagging] = useState<string | null>(null)
  const [downloadingSeb, setDownloadingSeb] = useState<string | null>(null)
  const [_showLobby, setShowLobby] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const logViolation = useCallback(
    async (
      type: string,
      detail?: string,
      opts?: { severity?: 'WARNING' | 'NOTICE' | 'CRITICAL' }
    ) => {
      void fetch('/api/staff/exams/internal/preview/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          bankId: data?.bank.id,
          type,
          detail,
          deviceInfo: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            platform: typeof navigator !== 'undefined' ? (navigator as Navigator & { platform?: string }).platform : undefined,
            language: typeof navigator !== 'undefined' ? navigator.language : undefined,
          },
          ...(opts?.severity ? { severity: opts.severity } : {}),
        }),
      })
      toast.warning(`Violation logged: ${type}`, {
        duration: 4000,
        position: 'bottom-right',
        dismissible: true,
      })
    },
    [data?.bank.id]
  )

  const loadPreview = async () => {
    if (!selectedBankId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/staff/exams/internal/preview?bankId=${selectedBankId}`)
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
        setCurrentIndex(0)
        setAnswers({})
        setTimeLeft(json.data.config.totalTimeSecs)
        setFlaggedQuestions(new Set())
        setTabSwitchCount(0)
        setShowLobby(false)
        setResult(null)
      } else {
        setError(json.error || 'Failed to generate preview')
      }
    } catch {
      setError('Could not connect to exam server')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadSeb = async (bankId: string) => {
    setDownloadingSeb(bankId)
    try {
      const res = await fetch(`/api/staff/exams/internal/banks/${bankId}/seb-config/download`)
      if (!res.ok) {
        toast.error('Could not download SEB config')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `exam-${bankId}.seb`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('SEB config downloaded')
    } catch {
      toast.error('Could not download SEB config')
    } finally {
      setDownloadingSeb(null)
    }
  }

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
      setShowFullscreenPrompt(false)
      document.body.classList.add('exam-lockdown')
    } catch {
      document.body.classList.add('exam-lockdown')
    }
  }, [])

  const _toggleFlag = useCallback(async (questionId: string, flagged: boolean) => {
    setFlagging(questionId)
    try {
      setFlaggedQuestions((prev) => {
        const next = new Set(prev)
        if (flagged) next.add(questionId)
        else next.delete(questionId)
        return next
      })
    } finally {
      setFlagging(null)
    }
  }, [])

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async (_auto = false) => {
    if (submitting) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const _answeredCount = Object.keys(answers).length
    const correctCount = data!.questions.filter(
      (q) => answers[q.questionId] === q.correctAnswer
    ).length
    const score = Math.round((correctCount / data!.questions.length) * 100)

    setResult({ score, correctCount, total: data!.questions.length })
    setShowConfirm(false)
    setSubmitting(false)
    document.body.classList.remove('exam-lockdown')
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }

  // â”€â”€â”€ Fullscreen lockdown mode â”€â”€â”€
  useEffect(() => {
    if (!data || result || showConfirm) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowFullscreenPrompt(true)
  }, [data, result, showConfirm])

  useEffect(() => {
    if (!data || result || showConfirm) return
    const onFsChange = () => {
      const inFS = !!document.fullscreenElement
      setIsFullscreen(inFS)
      if (!inFS && !result) {
        setShowFullscreenPrompt(true)
        void logViolation('FULLSCREEN_EXIT', 'Staff exited fullscreen during preview')
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [data, result, logViolation, showConfirm])

  // Tab visibility
  useEffect(() => {
    if (!data || result || showConfirm) return
    let warned = false
    const onVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((p) => p + 1)
        if (!warned) {
          warned = true
          void logViolation('TAB_SWITCH', 'Tab switched during preview')
        }
      } else warned = false
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [data, result, logViolation, showConfirm])

  // Clipboard blocking
  useEffect(() => {
    if (!data || result || showConfirm) return
    const onClipboard = (e: ClipboardEvent) => {
      e.preventDefault()
      void logViolation('CLIPBOARD_BLOCKED', `Clipboard event blocked: ${e.type}`)
    }
    document.addEventListener('copy', onClipboard)
    document.addEventListener('cut', onClipboard)
    document.addEventListener('paste', onClipboard)
    return () => {
      document.removeEventListener('copy', onClipboard)
      document.removeEventListener('cut', onClipboard)
      document.removeEventListener('paste', onClipboard)
    }
  }, [data, result, logViolation, showConfirm])

  // Keyboard shortcuts + strict keypress auto-submit
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!data?.config.allowKeyboardAutoSubmit || result || showConfirm) return
    const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'Meta'])
    const onKeyDown = (e: KeyboardEvent) => {
      if (MODIFIERS.has(e.key)) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const inInput = tag === 'input' || tag === 'textarea' || target?.isContentEditable
      const ctrlOrCmd = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      const isCopyPaste = ctrlOrCmd && (k === 'c' || k === 'v')
      const isF12 = e.key === 'F12'
      const isDevTools = ctrlOrCmd && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')
      if (!inInput && (isCopyPaste || isF12 || isDevTools)) {
        e.preventDefault()
        void logViolation('KEYBOARD_SHORTCUT', `Blocked shortcut: ${e.key}`)
        return
      }
      if (!submitting) {
        e.preventDefault()
        void logViolation('KEYBOARD_SHORTCUT', `Auto-submit triggered by key: ${e.key}`, {
          severity: 'CRITICAL',
        })
        void handleSubmit(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [data?.config.allowKeyboardAutoSubmit, result, showConfirm, logViolation])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Network detection
  useEffect(() => {
    if (!data || result || showConfirm) return
    const onNet = () =>
      void logViolation(
        'NETWORK_DISCONNECT',
        `Network ${navigator.onLine ? 'restored' : 'lost'} during preview`
      )
    window.addEventListener('online', onNet)
    window.addEventListener('offline', onNet)
    return () => {
      window.removeEventListener('online', onNet)
      window.removeEventListener('offline', onNet)
    }
  }, [data, result, logViolation, showConfirm])

  // Page unload
  useEffect(() => {
    if (!data || result || showConfirm) return
    const onUnload = () =>
      void fetch('/api/staff/exams/internal/preview/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        keepalive: true,
        body: JSON.stringify({
          bankId: data.bank.id,
          type: 'EXAM_INTERFACE_UNLOAD',
          detail: 'Staff navigated away or closed preview during active mode',
          deviceInfo: { userAgent: navigator.userAgent, platform: (navigator as Navigator & { platform?: string }).platform },
        }),
      })
    document.addEventListener('beforeunload', onUnload)
    document.addEventListener('pagehide', onUnload)
    return () => {
      document.removeEventListener('beforeunload', onUnload)
      document.removeEventListener('pagehide', onUnload)
    }
  }, [data, result, showConfirm])

  // Timer countdown
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!data || result) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [data, result])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Cleanup on unmount
  useEffect(
    () => () => {
      document.body.classList.remove('exam-lockdown')
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    },
    []
  )

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60),
      s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const _handleSubmitReport = async () => {
    if (!reportReason.trim() || reportSubmitting) return
    setReportSubmitting(true)
    try {
      await fetch('/api/staff/exams/internal/preview/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: data?.bank.id,
          type: 'DEVTOOLS_DETECTED',
          detail: reportReason.trim(),
        }),
      })
      setReportSubmitted(true)
      setReportReason('')
    } finally {
      setReportSubmitting(false)
    }
  }

  const _handleSubmitQuestionReport = async () => {
    if (!questionReportReason.trim() || questionReportSubmitting || !showQuestionReport) return
    setQuestionReportSubmitting(true)
    try {
      await fetch('/api/staff/exams/internal/preview/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: data?.bank.id,
          type: 'DEVTOOLS_DETECTED',
          detail: `Question ${showQuestionReport}: ${questionReportReason.trim()}`,
        }),
      })
      setReportedQuestions((prev) => new Set([...prev, showQuestionReport]))
      setShowQuestionReport(null)
      setQuestionReportReason('')
    } finally {
      setQuestionReportSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-aerojet-blue h-10 w-10 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <XCircle className="mb-4 h-12 w-12 text-red-500" />
        <p className="text-lg font-bold text-slate-900 dark:text-white">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name} ({bank.courseCode})
              </option>
            ))}
          </select>
          <button
            onClick={loadPreview}
            className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Load Preview
          </button>
          {selectedBankId && (
            <button
              onClick={() => handleDownloadSeb(selectedBankId)}
              disabled={downloadingSeb === selectedBankId}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {downloadingSeb === selectedBankId ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Download SEB Config
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500">Select an exam bank to preview.</p>
      </div>
    )
  }

  const questions = data.questions
  const currentQ = questions[currentIndex]
  const _answeredCount = Object.keys(answers).length
  const optionLabels = ['A', 'B', 'C']

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name} ({bank.courseCode})
              </option>
            ))}
          </select>
          <button
            onClick={loadPreview}
            className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white"
          >
            <BookOpen className="h-3.5 w-3.5" /> Reload
          </button>
        </div>
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Preview Complete</h2>
          <p className="mt-3 text-sm text-slate-500">
            Score: {result.correctCount}/{result.total} ({result.score}%)
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {showFullscreenPrompt && !result && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-amber-500" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Enter Preview Mode
            </h2>
            <p className="mt-2 text-sm text-slate-500">This preview runs in lockdown mode.</p>
            <button
              onClick={enterFullscreen}
              className="bg-aerojet-blue mt-6 inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white"
            >
              <Maximize className="h-4 w-4" /> Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name} ({bank.courseCode})
              </option>
            ))}
          </select>
          <button
            onClick={loadPreview}
            className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload
          </button>
          {selectedBankId && (
            <button
              onClick={() => handleDownloadSeb(selectedBankId)}
              disabled={downloadingSeb === selectedBankId}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {downloadingSeb === selectedBankId ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Download SEB Config
            </button>
          )}
          <span
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${timeLeft < 120 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${DIFFICULTY_COLORS[currentQ.difficulty] || ''}`}
            >
              {currentQ.difficulty}
            </span>
          </div>
          <p className="text-base font-medium text-slate-900 dark:text-slate-100">
            {currentQ.text}
          </p>
          <div className="mt-6 space-y-2">
            {currentQ.options.map((opt, i) => {
              const selected = answers[currentQ.questionId] === opt
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(currentQ.questionId, opt)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left ${selected ? 'border-aerojet-blue bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800">
                    {optionLabels[i]}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {opt}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-40 dark:bg-slate-900 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="bg-aerojet-blue flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white"
              >
                <Send className="h-4 w-4" /> Submit
              </button>
            )}
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h3 className="text-center text-xl font-black text-slate-900 dark:text-white">
              Submit Preview?
            </h3>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit(false)}
                className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
