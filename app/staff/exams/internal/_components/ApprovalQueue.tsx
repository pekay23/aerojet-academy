'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, X, Loader2 } from 'lucide-react'

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: string
  syllabusRef: string | null
  knowledgeLevel: number | null
}

export default function ApprovalQueue({ bankId }: { bankId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({})

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/exams/internal/banks/${bankId}/questions?status=PENDING_APPROVAL`)
      const json = await res.json()
      if (json.data) setQuestions(json.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [bankId])

  useEffect(() => {
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPending()
  }, [fetchPending])

  const handleReview = async (questionId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(questionId)
    try {
      const res = await fetch(`/api/staff/exams/internal/questions/${questionId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          reviewNote: status === 'REJECTED' ? rejectionNotes[questionId] : undefined 
        }),
      })
      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== questionId))
      }
    } catch {
      // Handle error gracefully
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
        No pending questions.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                Ref: {q.syllabusRef || 'N/A'}
              </span>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                Level: {q.knowledgeLevel || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReview(q.id, 'APPROVED')}
                disabled={processingId === q.id}
                className="inline-flex items-center gap-1 rounded bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
              >
                {processingId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approve
              </button>
            </div>
          </div>
          
          <p className="mb-3 text-sm font-medium text-slate-900 dark:text-white">{q.text}</p>
          
          <div className="mb-4 space-y-1">
            {q.options.map((opt, i) => (
              <div 
                key={i} 
                className={`rounded px-3 py-1.5 text-sm ${opt === q.correctAnswer ? 'bg-green-50 font-medium text-green-800 dark:bg-green-900/20 dark:text-green-200' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                {String.fromCharCode(65 + i)}. {opt}
                {opt === q.correctAnswer && <Check className="ml-2 inline h-3 w-3" />}
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
            <input 
              type="text" 
              placeholder="Rejection reason (optional)" 
              value={rejectionNotes[q.id] || ''}
              onChange={(e) => setRejectionNotes(prev => ({ ...prev, [q.id]: e.target.value }))}
              className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            <button
              onClick={() => handleReview(q.id, 'REJECTED')}
              disabled={processingId === q.id}
              className="inline-flex items-center gap-1 rounded bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
            >
              {processingId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
