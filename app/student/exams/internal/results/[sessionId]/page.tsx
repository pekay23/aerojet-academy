'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  Lightbulb,
  Download,
} from 'lucide-react'

interface QuestionResult {
  id: string
  text: string
  options: string[]
  points: number
  subTopic: string | null
  correctAnswer: string
  explanation: string | null
  studentAnswer: string | null
  isCorrect: boolean | null
  pointsAwarded: number | null
}

interface SessionResult {
  completed: boolean
  sessionId: string
  status: string
  score: number | null
  totalPoints: number | null
  percentage: number | null
  passed: boolean | null
  categoryCode: string | null
  passMarkPct: number | null
  isPublished: boolean
  questions: QuestionResult[]
  certificateId?: string | null
}

interface CertificateInfo {
  certificateId: string
  downloadUrl: string
}

export default function ExamResultsPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [data, setData] = useState<SessionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)
  const [showExplanations, setShowExplanations] = useState(false)
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null)
  const [certLoading, setCertLoading] = useState(false)
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null)
  const [certLoading, setCertLoading] = useState(false)
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null)
  const [certLoading, setCertLoading] = useState(false)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/student/exams/internal/session?sessionId=${sessionId}`)
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
        } else {
          setError(json.error || 'Failed to load results')
        }
      } catch {
        setError('Failed to connect to the exam server')
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-800" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-lg font-black text-slate-900 dark:text-white">{error || 'Results not available'}</p>
          <button
            onClick={() => router.push('/student/exams/internal')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-800/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Exams
          </button>
        </div>
      </div>
    )
  }

  if (!data.isPublished) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-900/10">
          <Clock className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Results Pending Review</h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Your answers have been recorded. Results are pending admin review and will be published to your profile once confirmed.
          </p>
          <button
            onClick={() => router.push('/student/exams/internal')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-800/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Exams
          </button>
        </div>
      </div>
    )
  }

  const answeredCount = data.questions.filter(q => q.studentAnswer !== null).length
  const correctCount = data.questions.filter(q => q.isCorrect).length

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/student/exams/internal')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-aerojet-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-blue-800 dark:text-white sm:text-3xl">
            Exam Results
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Session completed
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-2xl border p-5 text-center ${data.passed ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'}`}>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{data.percentage?.toFixed(1)}%</p>
          <p className="text-xs font-bold text-slate-500">Score</p>
          <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${data.passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
            {data.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {data.passed ? 'PASSED' : 'FAILED'}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-3xl font-black text-slate-900 dark:text-white">{data.score}/{data.totalPoints}</p>
          <p className="text-xs font-bold text-slate-500">Points</p>
          <p className="mt-2 text-xs text-slate-400">{answeredCount} answered, {correctCount} correct</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-3xl font-black text-slate-900 dark:text-white">{data.questions.length}</p>
          <p className="text-xs font-bold text-slate-500">Questions</p>
          <p className="mt-2 text-xs text-slate-400">Pass mark: {data.passMarkPct ?? 75}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Review Options</h3>
          <p className="text-xs text-slate-500">Choose what to reveal in the breakdown below</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              showAnswers
                ? 'bg-blue-800 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            {showAnswers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showAnswers ? 'Answers Visible' : 'Show Answers'}
          </button>
          <button
            onClick={() => setShowExplanations(!showExplanations)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              showExplanations
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            {showExplanations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showExplanations ? 'Explanations Visible' : 'Show Explanations'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {data.questions.map((q, i) => {
          const optionLabels = ['A', 'B', 'C']
          return (
            <div
              key={q.id}
              className={`rounded-2xl border p-5 transition-colors ${
                q.isCorrect
                  ? 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-900/5'
                  : 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-900/5'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {q.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-xs font-bold text-slate-500">
                      {q.isCorrect ? 'Correct' : 'Incorrect'} • {q.pointsAwarded}/{q.points} pts
                    </span>
                  </div>
                </div>
                {q.subTopic && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {q.subTopic}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">{q.text}</p>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {q.options.map((opt, idx) => {
                  const isStudentAnswer = q.studentAnswer === opt
                  const isCorrectAnswer = showAnswers && q.correctAnswer === opt
                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 text-sm ${
                        isCorrectAnswer
                          ? 'border-green-300 bg-green-100 font-bold text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200'
                          : isStudentAnswer && !isCorrectAnswer
                          ? 'border-red-300 bg-red-100 font-bold text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                      }`}
                    >
                      <span className="font-bold">{optionLabels[idx]}:</span> {opt}
                      {isStudentAnswer && <span className="ml-1 text-[10px] text-slate-400">(your answer)</span>}
                    </div>
                  )
                })}
              </div>

              {showAnswers && !q.isCorrect && (
                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-900/10">
                  <span className="font-bold text-green-700 dark:text-green-300">Correct answer: </span>
                  <span className="text-green-800 dark:text-green-200">{q.correctAnswer}</span>
                </div>
              )}

              {showExplanations && q.explanation && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    <Lightbulb className="h-4 w-4" />
                    Explanation
                  </div>
                  <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{q.explanation}</p>
                </div>
              )}

              {showExplanations && !q.explanation && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                  No explanation available for this question.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
