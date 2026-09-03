'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { cn } from '@/lib/utils'

interface SupervisedExamInterfaceProps {
  sessionId: string
  studentName: string
  studentEmail: string
  bankName: string
  className?: string
}

interface ExamQuestion {
  id: string
  text: string
  options: string[]
  points: number
  subTopic: string
}

interface ActivityLogEntry {
  timestamp: string
  type: string
  description: string
}

export default function SupervisedExamInterface({
  sessionId,
  studentName,
  studentEmail,
  bankName,
  className,
}: SupervisedExamInterfaceProps) {
  const [session, setSession] = useState<any>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const [extensionMinutes, setExtensionMinutes] = useState(15)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const logActivity = useCallback((type: string, description: string) => {
    const entry: ActivityLogEntry = {
      timestamp: new Date().toISOString(),
      type,
      description,
    }
    setActivityLog((prev) => [...prev, entry])

    createAuditLog({
      action: AuditAction.EXAM_SESSION_STARTED,
      entity: 'InternalExamSession',
      entityId: sessionId,
      description: `[Supervised] ${type}: ${description}`,
      details: { studentName, studentEmail, bankName, className, type, description },
    }).catch(() => {})
  }, [sessionId, studentName, studentEmail, bankName, className])

  const startExam = useCallback(async () => {
    setIsStarting(true)
    try {
      const res = await fetch(`/api/staff/exams/internal/sessions/${sessionId}/supervise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to start exam')
        return
      }

      const sessionData = data.data
      setSession(sessionData)
      setQuestions(sessionData.questions || [])
      setSavedAnswers(Object.fromEntries((sessionData.savedAnswers || []).map((a: any) => [a.questionId, a.selectedAnswer])))
      setTimeLeft(sessionData.totalTimeSecs || 0)
      setIsSubmitted(false)
      logActivity('EXAM_STARTED', `Invigilator started supervised exam for ${studentName}`)
    } catch (err) {
      setError('Failed to start exam')
    } finally {
      setIsStarting(false)
    }
  }, [sessionId, studentName, logActivity])

  const submitExam = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/exams/internal/sessions/${sessionId}/force-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to submit exam')
        return
      }
      setIsSubmitted(true)
      logActivity('EXAM_SUBMITTED', `Invigilator force-submitted exam for ${studentName}`)
    } catch (err) {
      setError('Failed to submit exam')
    }
  }, [sessionId, studentName, logActivity])

  const extendTime = useCallback(async () => {
    setIsExtending(true)
    try {
      const res = await fetch(`/api/staff/exams/internal/sessions/${sessionId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeExtensionSec: extensionMinutes * 60 }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to extend time')
        return
      }
      setTimeLeft((prev) => prev + extensionMinutes * 60)
      logActivity('TIME_EXTENDED', `Invigilator extended exam time by ${extensionMinutes} minutes for ${studentName}`)
    } catch (err) {
      setError('Failed to extend time')
    } finally {
      setIsExtending(false)
    }
  }, [sessionId, extensionMinutes, studentName, logActivity])

  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setSavedAnswers((prev) => {
      const next = { ...prev, [questionId]: answer }
      return next
    })
    logActivity('ANSWER_CHANGED', `Answer changed for question ${questionId}`)

    fetch(`/api/staff/exams/internal/sessions/${sessionId}/supervise/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, selectedAnswer: answer }),
    }).catch(() => {})
  }, [sessionId, logActivity])

  const submitExamRef = useRef(submitExam)
  useEffect(() => {
    submitExamRef.current = submitExam
  }, [submitExam])

  useEffect(() => {
    if (timeLeft <= 0 && session && !isSubmitted) {
      submitExamRef.current()
      return
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timeLeft, session, isSubmitted])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const answeredCount = Object.keys(savedAnswers).filter((k) => savedAnswers[k]).length
  const totalQuestions = questions.length
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-yellow-900">Supervised Session</h1>
            <p className="text-yellow-700 mt-1">
              Candidate: <span className="font-semibold">{studentName}</span> ({studentEmail})
            </p>
            {className && (
              <p className="text-yellow-700">Class: {className}</p>
            )}
            <p className="text-yellow-700">Bank: {bankName}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-mono font-bold text-yellow-900">{formatTime(timeLeft)}</p>
            <p className="text-sm text-yellow-600">Time Remaining</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-4 flex-1">
          <p className="text-sm text-gray-500">Progress</p>
          <p className="text-2xl font-bold">{answeredCount} / {totalQuestions}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setShowActivityLog((prev) => !prev)}
          className="bg-white rounded-lg shadow px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          {showActivityLog ? 'Hide' : 'Show'} Activity Log ({activityLog.length})
        </button>
      </div>

      {!session && !isStarting && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-lg mb-4">Ready to begin the supervised exam for {studentName}.</p>
          <button
            onClick={startExam}
            disabled={isStarting}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {isStarting ? 'Starting...' : 'Start Exam'}
          </button>
        </div>
      )}

      {session && !isSubmitted && (
        <div className="bg-white rounded-lg shadow">
          {questions.length > 0 && currentQuestionIndex < questions.length && (
            <div>
              {(() => {
                const q = questions[currentQuestionIndex]
                const selected = savedAnswers[q.id] || ''
                return (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                      </span>
                      <span className="text-sm text-gray-500">{q.subTopic}</span>
                    </div>
                    <p className="text-lg font-medium mb-6">{q.text}</p>
                    <div className="space-y-3">
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className={cn(
                            'flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors',
                            selected === opt
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt}
                            checked={selected === opt}
                            onChange={() => handleAnswerChange(q.id, opt)}
                            className="mr-3"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-between mt-6">
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                        disabled={currentQuestionIndex === totalQuestions - 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          <div className="border-t p-4 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={submitExam}
                disabled={isSubmitted}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Force Submit
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={extensionMinutes}
                  onChange={(e) => setExtensionMinutes(Math.max(1, parseInt(e.target.value) || 15))}
                  className="w-16 border rounded px-2 py-2 text-center"
                  min="1"
                />
                <span className="text-sm text-gray-500">min</span>
                <button
                  onClick={extendTime}
                  disabled={isExtending}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isExtending ? 'Extending...' : 'Extend Time'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">Exam Submitted</h2>
          <p className="text-gray-600">The supervised exam has been submitted successfully.</p>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline text-sm">Dismiss</button>
        </div>
      )}

      {showActivityLog && (
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Activity Log</h3>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {activityLog.map((entry, idx) => (
              <div key={idx} className="text-sm border-b pb-1">
                <span className="text-gray-500 font-mono">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span className="ml-2 font-medium">{entry.type}</span>
                <span className="ml-2 text-gray-600">{entry.description}</span>
              </div>
            ))}
            {activityLog.length === 0 && (
              <p className="text-gray-400 text-sm">No activity recorded yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
