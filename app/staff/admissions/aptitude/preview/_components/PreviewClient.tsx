'use client'

import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Clock,
  BarChart3,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

interface Bank {
  id: string
  name: string
}

interface PreviewQuestion {
  index: number
  questionId: string
  category: string
  questionType: string
  difficulty: string
  text: string
  options: string[] | null
  correctAnswer: string
  explanation: string | null
  points: number
}

interface PreviewData {
  bank: { id: string; name: string; description: string | null }
  config: { timeLimitMinutes: number; passThresholdPct: number; totalQuestions: number }
  stats: { category: string; requested: number; available: number }[]
  questions: PreviewQuestion[]
}

const CATEGORY_COLORS: Record<string, string> = {
  MATH: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ENGLISH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ENGINEERING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  LOGICAL_REASONING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PHYSICS: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function PreviewClient({ banks }: { banks: Bank[] }) {
  const [selectedBankId, setSelectedBankId] = useState(banks[0]?.id || '')
  const [data, setData] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [showAnswers, setShowAnswers] = useState(true)
  const [mode, setMode] = useState<'select' | 'preview'>('select')

  const loadPreview = async () => {
    if (!selectedBankId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/admissions/aptitude/preview?bankId=${selectedBankId}`)
      const json = await res.json()
      if (json.data) {
        setData(json.data)
        setCurrentIndex(0)
        setSelectedAnswers({})
        setMode('preview')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  if (mode === 'select' || !data) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-aerojet-blue dark:bg-blue-900/20">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white">Start Preview</h2>
              <p className="text-sm text-slate-500">Select a question bank to preview.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Question Bank
              </label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadPreview}
              disabled={loading || !selectedBankId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-aerojet-blue px-6 py-3 font-bold text-white shadow-lg shadow-aerojet-blue/20 transition-all hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
              {loading ? 'Generating Preview...' : 'Generate Preview'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const q = data.questions[currentIndex]
  const answered = selectedAnswers[q.questionId]
  const isCorrect = answered === q.correctAnswer
  const answeredCount = Object.keys(selectedAnswers).length
  const correctCount = data.questions.filter(
    (qu) => selectedAnswers[qu.questionId] === qu.correctAnswer
  ).length

  return (
    <div className="space-y-4">
      {/* Top bar — stats + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode('select')}
            className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-aerojet-blue"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {data.bank.name}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" /> {data.config.timeLimitMinutes} min
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <BarChart3 className="h-3.5 w-3.5" /> Pass: {data.config.passThresholdPct}%
          </div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {answeredCount}/{data.questions.length} answered
            {answeredCount > 0 && (
              <span className="ml-1 text-green-600">
                ({correctCount} correct — {Math.round((correctCount / answeredCount) * 100)}%)
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {showAnswers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showAnswers ? 'Hide Answers' : 'Show Answers'}
          </button>
          <button
            onClick={loadPreview}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reshuffle
          </button>
        </div>
      </div>

      {/* Pool health stats */}
      <div className="grid grid-cols-5 gap-2">
        {data.stats.map((s) => (
          <div
            key={s.category}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {s.category.replace('_', ' ')}
            </div>
            <div className="mt-1 text-sm font-black text-slate-800 dark:text-white">
              {s.requested} / {s.available}
            </div>
            <div className="text-[10px] text-slate-400">used / pool</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* Main question area */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Question header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Q{currentIndex + 1} of {data.questions.length}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_COLORS[q.category] || ''}`}
              >
                {q.category.replace('_', ' ')}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIFFICULTY_COLORS[q.difficulty] || ''}`}
              >
                {q.difficulty}
              </span>
            </div>
            <span className="text-xs text-slate-400">{q.points} pt{q.points > 1 ? 's' : ''}</span>
          </div>

          {/* Question text */}
          <h2 className="mb-6 text-lg font-medium leading-relaxed text-slate-800 dark:text-slate-200">
            {q.text}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {q.questionType === 'MCQ' &&
              q.options &&
              Array.isArray(q.options) &&
              q.options.map((opt: string, i: number) => {
                const isSelected = answered === opt
                const isAnswer = q.correctAnswer === opt
                let borderClass =
                  'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'

                if (isSelected && showAnswers) {
                  borderClass = isCorrect
                    ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                    : 'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                } else if (isSelected) {
                  borderClass =
                    'border-aerojet-blue bg-blue-50/50 shadow-sm dark:border-blue-500 dark:bg-blue-900/20'
                } else if (showAnswers && isAnswer) {
                  borderClass =
                    'border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-900/10'
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(q.questionId, opt)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${borderClass}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                          isSelected
                            ? 'border-aerojet-blue bg-aerojet-blue text-white'
                            : showAnswers && isAnswer
                              ? 'border-green-400 bg-green-100 text-green-700'
                              : 'border-slate-300 text-slate-500 dark:border-slate-700'
                        }`}
                      >
                        {showAnswers && isAnswer ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isSelected && showAnswers && !isCorrect ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{opt}</span>
                    </div>
                  </button>
                )
              })}

            {q.questionType === 'TRUE_FALSE' &&
              ['True', 'False'].map((opt) => {
                const isSelected = answered === opt
                const isAnswer = q.correctAnswer === opt
                let borderClass =
                  'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                if (isSelected && showAnswers) {
                  borderClass = isCorrect
                    ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                    : 'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                } else if (isSelected) {
                  borderClass = 'border-aerojet-blue bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
                } else if (showAnswers && isAnswer) {
                  borderClass = 'border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-900/10'
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.questionId, opt)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${borderClass}`}
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">{opt}</span>
                  </button>
                )
              })}

            {q.questionType === 'NUMERIC_INPUT' && (
              <div className="pt-2">
                <input
                  type="number"
                  value={answered || ''}
                  onChange={(e) => handleAnswer(q.questionId, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-4 text-lg font-medium shadow-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  placeholder="Enter exact number..."
                />
                {showAnswers && (
                  <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    Correct answer: {q.correctAnswer}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Explanation */}
          {showAnswers && q.explanation && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-900/10">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-500">
                Explanation
              </div>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">{q.explanation}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-5 w-5" /> Previous
            </button>

            <div className="hidden gap-1 md:flex">
              {data.questions.map((qu, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    currentIndex === i
                      ? 'scale-125 bg-aerojet-blue'
                      : selectedAnswers[qu.questionId]
                        ? selectedAnswers[qu.questionId] === qu.correctAnswer && showAnswers
                          ? 'bg-green-400'
                          : showAnswers
                            ? 'bg-red-400'
                            : 'bg-slate-400'
                        : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  title={`Question ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentIndex((p) => Math.min(data.questions.length - 1, p + 1))
              }
              disabled={currentIndex === data.questions.length - 1}
              className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-5 py-2.5 font-bold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-30"
            >
              Next <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sidebar — question grid + legend */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Question Navigator
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {data.questions.map((qu, i) => {
                const ans = selectedAnswers[qu.questionId]
                let bg = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                if (currentIndex === i) {
                  bg = 'bg-aerojet-blue text-white'
                } else if (ans && showAnswers) {
                  bg =
                    ans === qu.correctAnswer
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                } else if (ans) {
                  bg = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all hover:scale-105 ${bg}`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Category Breakdown
            </h3>
            <div className="space-y-2">
              {data.stats
                .filter((s) => s.requested > 0)
                .map((s) => {
                  const catQuestions = data.questions.filter((qu) => qu.category === s.category)
                  const catAnswered = catQuestions.filter(
                    (qu) => selectedAnswers[qu.questionId]
                  ).length
                  const catCorrect = catQuestions.filter(
                    (qu) => selectedAnswers[qu.questionId] === qu.correctAnswer
                  ).length

                  return (
                    <div key={s.category} className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_COLORS[s.category]}`}
                      >
                        {s.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500">
                        {catCorrect}/{catAnswered}/{s.requested}
                      </span>
                    </div>
                  )
                })}
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-800">
              correct / answered / total
            </div>
          </div>

          <Link
            href="/staff/admissions/aptitude"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Aptitude
          </Link>
        </div>
      </div>
    </div>
  )
}
