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
  Menu,
  X,
} from 'lucide-react'

interface Question {
  id: string
  text: string
  options: any // JSON array of option strings
  points: number
  subTopic: string | null
  syllabusRef?: string | null
  knowledgeLevel?: string | null
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
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
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
    <div className="flex h-[calc(100vh-64px)] w-full flex-col bg-slate-50 dark:bg-slate-950 lg:flex-row overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <button
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
          timeLeft < 120 ? 'bg-red-100 text-red-700 animate-pulse'
          : timeLeft < 300 ? 'bg-amber-100 text-amber-700'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          <Clock className="h-4 w-4" />
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Left Panel: Question Navigator */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 transform flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:flex lg:translate-x-0 ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-full'} ${isLeftPanelOpen ? 'flex' : 'hidden lg:flex'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Navigator</h2>
          <button className="lg:hidden" onClick={() => setIsLeftPanelOpen(false)}>
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, i) => {
              const answered = !!answers[q.id]
              const isCurrent = i === currentIdx
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIdx(i)
                    if (window.innerWidth < 1024) setIsLeftPanelOpen(false)
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                    isCurrent
                      ? 'bg-aerojet-blue text-white shadow-md'
                      : answered
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Middle Panel: Main Question Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-3xl">
            {/* Question Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:p-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {currentIdx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-400">Question</div>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      of {questions.length}
                    </div>
                  </div>
                </div>
                {currentQ.syllabusRef && (
                  <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Ref: {currentQ.syllabusRef}
                    {currentQ.knowledgeLevel && ` • Lvl ${currentQ.knowledgeLevel}`}
                  </div>
                )}
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                  {currentQ.text}
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {options.map((opt, i) => {
                  const selected = answers[currentQ.id] === opt
                  return (
                    <button
                      key={i}
                      onClick={() => selectAnswer(currentQ.id, opt)}
                      className={`group flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                        selected
                          ? 'border-aerojet-blue bg-blue-50 dark:border-aerojet-sky dark:bg-blue-900/20'
                          : 'border-slate-200 bg-white hover:border-aerojet-blue/30 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-aerojet-sky/30'
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                        selected
                          ? 'bg-aerojet-blue text-white dark:bg-aerojet-sky'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {optionLabels[i]}
                      </span>
                      <span className={`text-base font-medium ${selected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {opt}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-aerojet-blue/90 dark:bg-aerojet-sky dark:text-slate-900 dark:hover:bg-aerojet-sky/90"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Status & Progress */}
      <div className="hidden w-72 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="flex flex-col items-center justify-center border-b border-slate-200 p-6 dark:border-slate-800">
          <Clock className={`mb-2 h-8 w-8 ${timeLeft < 120 ? 'text-red-500 animate-pulse' : timeLeft < 300 ? 'text-amber-500' : 'text-slate-400'}`} />
          <div className={`text-3xl font-black tabular-nums ${timeLeft < 120 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Time Remaining</div>
        </div>
        
        <div className="p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Exam Status</h3>
          
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm font-medium">
                <span className="text-slate-500">Progress</span>
                <span className="text-slate-900 dark:text-white">{Math.round((answeredCount / questions.length) * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div 
                  className="h-full bg-aerojet-blue transition-all dark:bg-aerojet-sky"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Answered</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{answeredCount}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Unanswered</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{unansweredCount}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Finish & Submit
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h3 className="text-center text-xl font-black text-slate-900 dark:text-white">Submit Examination?</h3>
            
            <div className="my-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/50">
              <div className="flex justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                <span className="text-slate-500">Answered Questions</span>
                <span className="font-bold text-green-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unanswered Questions</span>
                <span className={`font-bold ${unansweredCount > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                  {unansweredCount}
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
                You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}.<br/>
                They will be marked as incorrect.
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Review Answers
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
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
