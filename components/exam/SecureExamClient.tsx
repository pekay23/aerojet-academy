'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import { Clock, ChevronLeft, ChevronRight, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react'

interface Question {
  id: string
  text: string
  options: string[]
  points: number
}

interface ExamData {
  sessionId: string
  status: string
  questions: Question[]
  savedAnswers: { questionId: string; selectedAnswer: string | null }[]
  totalTimeSecs: number
  expiresAt: string
  rules: {
    timePerQuestionSecs: number
    passMarkPct: number
  }
}

export default function SecureExamClient({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [data, setData] = useState<ExamData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleSubmit = useCallback(
    async (autoSubmitted = false) => {
      if (submitting) return
      setSubmitting(true)

      try {
        const res = await fetch('/api/student/exams/internal/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
              questionId,
              selectedAnswer,
            })),
            autoSubmitted,
          }),
        })

        const json = await res.json()
        if (json.success) {
          toast.success(autoSubmitted ? 'Exam auto-submitted due to violation' : 'Exam submitted successfully')
          router.push(`/student/exams/internal/results/${sessionId}`)
        } else {
          toast.error(json.error || 'Failed to submit exam')
          setSubmitting(false)
        }
      } catch {
        toast.error('Failed to submit exam')
        setSubmitting(false)
      }
    },
    [sessionId, answers, submitting, router]
  )

  const { logViolation, _isFullscreen, tabSwitchCount, devToolsDetected } = useAntiCheat({
    sessionId,
    enforceFullscreen: true,
    blockClipboard: true,
    blockKeyboardShortcuts: true,
    detectDevTools: true,
    preventMultiTab: true,
    logUnload: true,
    detectTabSwitch: true,
    onCriticalViolation: (type) => {
      if (type === 'MULTI_TAB' || type === 'DEVTOOLS_OPEN') {
        void handleSubmit(true)
      }
    },
  })

  // Load session
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/student/exams/internal/session?sessionId=${sessionId}`)
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
          setTimeLeft(json.data.totalTimeSecs)
          const saved: Record<string, string> = {}
          for (const sa of json.data.savedAnswers || []) {
            if (sa.selectedAnswer) saved[sa.questionId] = sa.selectedAnswer
          }
          setAnswers(saved)
        } else {
          setError(json.error || 'Failed to load exam session')
        }
      } catch {
        setError('Failed to connect to exam server')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  // Timer
  useEffect(() => {
    if (!data || submitting) return
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
  }, [data, submitting, handleSubmit])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-black">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-aerojet-blue border-t-transparent" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading secure exam environment...
          </p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-black">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-lg font-bold text-slate-900 dark:text-white">{error || 'Failed to load exam'}</p>
        </div>
      </div>
    )
  }

  const currentQ = data.questions[currentIdx]
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === data.questions.length

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-black">
      {/* ARIA live region for accessibility announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {timeLeft < 60 && 'Warning: Less than 60 seconds remaining'}
        {devToolsDetected && 'Warning: Developer tools detected'}
        {tabSwitchCount > 0 && `Warning: Tab switched ${tabSwitchCount} times`}
      </div>

      {/* Security Status Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-red-50 px-4 py-2 dark:border-red-900 dark:bg-red-900/20" role="status" aria-label="Exam security status">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
              Secure Mode
            </span>
          </div>
          {devToolsDetected && (
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              DevTools Detected
            </span>
          )}
          {tabSwitchCount > 0 && (
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              Tab Switches: {tabSwitchCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <span className={`text-sm font-mono font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Question {currentIdx + 1} of {data.questions.length}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {currentQ.points} {currentQ.points === 1 ? 'point' : 'points'}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg leading-relaxed text-slate-900 dark:text-white">{currentQ.text}</p>

            <div className="mt-8 space-y-3">
              {currentQ.options.map((option, idx) => {
                const isSelected = answers[currentQ.id] === option
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, [currentQ.id]: option }))
                      logViolation('ANSWER_SELECTED', `Selected option ${String.fromCharCode(65 + idx)}`)
                    }}
                    className={`w-full rounded-xl border-2 px-6 py-4 text-left transition-all ${
                      isSelected
                        ? 'border-aerojet-blue bg-aerojet-blue/5 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          isSelected
                            ? 'bg-aerojet-blue text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className={`text-base ${isSelected ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {option}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900" role="navigation" aria-label="Exam navigation">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            aria-label={`Previous question. Currently on question ${currentIdx + 1} of ${data.questions.length}`}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" /> Previous
          </button>

          <div className="flex items-center gap-2" aria-live="polite" aria-atomic="true">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {answeredCount} / {data.questions.length} answered
            </span>
          </div>

          {currentIdx < data.questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(data.questions.length - 1, prev + 1))}
              aria-label={`Next question. Currently on question ${currentIdx + 1} of ${data.questions.length}`}
              className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-5 py-2.5 font-bold text-white shadow-md transition-all hover:bg-blue-700"
            >
              Next <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (!allAnswered && !confirm('You have unanswered questions. Are you sure you want to submit?')) return
                handleSubmit()
              }}
              disabled={submitting}
              aria-label={allAnswered ? 'Submit exam' : `Submit exam with ${data.questions.length - answeredCount} unanswered questions`}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 font-bold text-white shadow-md transition-all hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : 'Submit Exam'}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
