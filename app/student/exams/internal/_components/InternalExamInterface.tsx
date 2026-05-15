'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  SkipForward,
  Send,
  XCircle,
  Trophy,
} from 'lucide-react'

interface Question {
  id: string
  text: string
  options: any // JSON array of option strings
  points: number
  subTopic: string | null
}

interface ExamData {
  sessionId: string
  questions: Question[]
  savedAnswers: { questionId: string; selectedAnswer: string | null }[]
  totalTimeSecs: number
  expiresAt: string
  resumed: boolean
  rules: {
    timePerQuestionSecs: number
    passMarkPct: number
    allowKeyboardAutoSubmit: boolean
  }
}

interface ExamResult {
  score: number
  totalPoints: number
  percentage: number
  passed: boolean
  passMarkPct: number
  timedOut: boolean
  retakeEligibleAt: string
  banned: boolean
  banLiftDate: string | null
}

export default function InternalExamInterface({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<ExamData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<ExamResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load or resume session
  useEffect(() => {
    const load = async () => {
      try {
        const sessionRes = await fetch(`/api/student/exams/internal/session?sessionId=${sessionId}`)
        const json = await sessionRes.json()
        if (json.success && json.data) {
          setData(json.data)
          setTimeLeft(json.data.totalTimeSecs)
          // Restore saved answers
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

  // Timer countdown
  useEffect(() => {
    if (!data || result) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-submit on expiry
          clearInterval(timerRef.current!)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [data, result])

  // Autosave answer
  const saveAnswer = useCallback(async (questionId: string, selectedAnswer: string) => {
    try {
      await fetch('/api/student/exams/internal/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId, selectedAnswer }),
      })
    } catch { /* silent — answers are also submitted at final submit */ }
  }, [sessionId])

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    saveAnswer(questionId, answer)
  }

  const handleSubmit = async (auto = false) => {
    if (submitting) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)

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
          autoSubmitted: auto,
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setResult(json.data)
      } else {
        setError(json.error || 'Failed to submit')
      }
    } catch {
      setError('An error occurred during submission')
    } finally {
      setSubmitting(false)
      setShowConfirm(false)
    }
  }

  useEffect(() => {
    if (!data?.rules.allowKeyboardAutoSubmit || result || submitting || showConfirm) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) return
      event.preventDefault()
      handleSubmit(true)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [data?.rules.allowKeyboardAutoSubmit, result, submitting, showConfirm, answers])

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <XCircle className="mb-4 h-12 w-12 text-red-500" />
        <p className="text-lg font-bold text-slate-900 dark:text-white">{error}</p>
        <a href="/student/exams/internal" className="mt-4 text-sm font-medium text-aerojet-blue hover:underline">
          Back to Exams
        </a>
      </div>
    )
  }

  // Result screen
  if (result) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          {result.passed ? (
            <Trophy className="mx-auto mb-4 h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          )}
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {result.passed ? 'Congratulations!' : result.timedOut ? 'Time Expired' : 'Not Passed'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {result.passed ? 'You have passed this module examination.' : 'You did not meet the pass mark this time.'}
          </p>

          <div className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.percentage}%</p>
              <p className="text-[10px] text-slate-500">Your Score</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.passMarkPct}%</p>
              <p className="text-[10px] text-slate-500">Pass Mark</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.score}</p>
              <p className="text-[10px] text-slate-500">Points</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.totalPoints}</p>
              <p className="text-[10px] text-slate-500">Total</p>
            </div>
          </div>

          {result.banned && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/10 dark:text-red-300">
              12-month suspension applied. Retake available after {new Date(result.banLiftDate!).toLocaleDateString()}.
            </div>
          )}

          {!result.passed && !result.banned && (
            <p className="mt-4 text-xs text-slate-500">
              Retake available after {new Date(result.retakeEligibleAt).toLocaleDateString()}.
            </p>
          )}

          <a
            href="/student/exams/internal"
            className="mt-6 inline-block rounded-xl bg-aerojet-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-aerojet-blue/90"
          >
            Back to Exams
          </a>
        </div>
      </div>
    )
  }

  if (!data) return null
  const questions = data.questions
  const currentQ = questions[currentIdx]
  const answeredCount = Object.keys(answers).length
  const unansweredCount = questions.length - answeredCount
  const options: string[] = Array.isArray(currentQ?.options) ? currentQ.options : []
  const optionLabels = ['A', 'B', 'C']

  return (
    <div className="flex min-h-[80vh] flex-col">
      {/* Top Bar — Timer + Progress */}
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
            timeLeft < 120 ? 'bg-red-100 text-red-700 animate-pulse dark:bg-red-900/30 dark:text-red-300'
            : timeLeft < 300 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="text-green-600">{answeredCount} answered</span>
          <span className="text-slate-400">{unansweredCount} remaining</span>
          <span className="text-slate-600 dark:text-slate-300">
            Q{currentIdx + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="mt-6 flex-1">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1 text-xs font-bold text-slate-400">
            Question {currentIdx + 1} of {questions.length}
            {currentQ.subTopic && <span className="ml-2 text-slate-300">• {currentQ.subTopic}</span>}
          </div>
          <p className="text-base font-medium text-slate-900 dark:text-white leading-relaxed">
            {currentQ.text}
          </p>

          {/* Options */}
          <div className="mt-6 space-y-3">
            {options.map((opt, i) => {
              const selected = answers[currentQ.id] === opt
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(currentQ.id, opt)}
                  className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left text-sm transition-all ${
                    selected
                      ? 'border-aerojet-blue bg-blue-50 dark:border-aerojet-sky dark:bg-blue-900/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                  }`}
                  aria-label={`Option ${optionLabels[i]}: ${opt}`}
                  aria-pressed={selected}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    selected
                      ? 'bg-aerojet-blue text-white dark:bg-aerojet-sky'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                  }`}>
                    {optionLabels[i]}
                  </span>
                  <span className={`font-medium ${selected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    {opt}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          aria-label="Previous question"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex items-center gap-2">
          {currentIdx < questions.length - 1 && !answers[currentQ.id] && (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Skip this question for now"
            >
              <SkipForward className="h-4 w-4" />
              Skip
            </button>
          )}
          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              className="flex items-center gap-1 rounded-lg bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-aerojet-blue/90 dark:bg-aerojet-sky"
              aria-label="Next question"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Submit Exam
            </button>
          )}
        </div>
      </div>

      {/* Question Palette */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Question Navigator</h4>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, i) => {
            const answered = !!answers[q.id]
            const isCurrent = i === currentIdx
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-aerojet-blue text-white ring-2 ring-aerojet-blue/30'
                    : answered
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                }`}
                aria-label={`Go to question ${i + 1}${answered ? ', answered' : ', unanswered'}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-green-400" /> Answered ({answeredCount})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-slate-300" /> Unanswered ({unansweredCount})
          </span>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
            <h3 className="text-center text-lg font-bold text-slate-900 dark:text-white">Submit Exam?</h3>
            <div className="mt-3 space-y-2 text-center text-sm text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-bold text-green-600">{answeredCount}</span> answered
                {' • '}
                <span className="font-bold text-red-600">{unansweredCount}</span> unanswered
              </p>
              {unansweredCount > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}.
                  Unanswered questions will be marked as incorrect.
                </p>
              )}
              <p className="text-xs text-slate-400">This action cannot be undone.</p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Review Answers
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
