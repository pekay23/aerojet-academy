'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import TestTimer from './TestTimer'
import QuestionCard from './QuestionCard'

interface TestInterfaceProps {
  session: {
    id: string
    expiresAt: string
    questions: any[]
  }
}

export interface TestQuestion {
  questionId: string
  text: string
  options: string[]
  selectedAnswer: string | null
}

export default function TestInterface({ session }: TestInterfaceProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState(session.questions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleAnswer = async (questionId: string, answer: string) => {
    // Optimistic update
    setQuestions((prev) =>
      prev.map((q) => (q.questionId === questionId ? { ...q, selectedAnswer: answer } : q))
    )

    // Background sync
    try {
      await fetch('/api/applicant/aptitude/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, questionId, answer }),
      })
    } catch (e) {
      console.error('Failed to sync answer')
    }
  }

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await fetch('/api/applicant/aptitude/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      })
      router.push('/applicant/application/aptitude-test')
    } catch (e) {
      console.error(e)
      setSubmitting(false)
    }
  }, [session.id, submitting, router])

  const handleTimeExpire = useCallback(() => {
    handleSubmit()
  }, [handleSubmit])

  const answeredCount = questions.filter(
    (q) => q.selectedAnswer !== null && q.selectedAnswer !== ''
  ).length
  const allAnswered = answeredCount === questions.length

  const currentQ = questions[currentIndex]

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="bg-aerojet-blue h-full transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            {answeredCount} of {questions.length} answered
          </span>
        </div>

        <div className="flex items-center gap-4">
          <TestTimer expiresAt={session.expiresAt} onExpire={handleTimeExpire} />
          <button
            onClick={() => {
              if (
                !allAnswered &&
                !confirm('You have unanswered questions. Are you sure you want to submit?')
              )
                return
              handleSubmit()
            }}
            disabled={submitting}
            className={`flex items-center gap-2 rounded-xl px-5 py-2 font-bold transition-all ${
              allAnswered
                ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Submit
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-12">
        <QuestionCard
          question={currentQ}
          index={currentIndex}
          total={questions.length}
          onAnswer={handleAnswer}
        />
      </main>

      {/* Footer Navigation */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-5 w-5" /> Previous
          </button>

          <div className="hidden gap-1 md:flex">
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  currentIndex === i
                    ? 'bg-aerojet-blue scale-125'
                    : q.selectedAnswer
                      ? 'bg-slate-400'
                      : 'bg-slate-200 dark:bg-slate-700'
                }`}
                title={`Question ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIndex === questions.length - 1}
            className="bg-aerojet-blue flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-30"
          >
            Next <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </div>
  )
}
