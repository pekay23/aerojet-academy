'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Trophy,
  Hourglass,
} from 'lucide-react'

interface BankProgress {
  bankId: string
  bankName: string
  moduleCode: string | null
  categoryCode: string | null
  courseName: string
  courseCode: string
  attempted: boolean
  passed: boolean
  bestScore: number
  totalAttempts: number
  banned: boolean
  banLiftDate: string | null
  retakeEligibleAt: string | null
  isPublished: boolean
  pendingReview: boolean
}

interface ProgressData {
  studentDetails: {
    name: string
    email: string
    studentId: string | null
    dateOfBirth: string | null
    phone: string | null
    nationality: string | null
    enrollmentType: string | null
    programmeChoice: string | null
    targetCategories: string[]
  }
  bankProgress: BankProgress[]
  completionWindow: {
    startDate: string
    deadline: string
    yearsTotal: number
    percentElapsed: number
    remainingDays: number
  } | null
  summary: { totalModules: number; passedModules: number; progressPercent: number }
}

export default function InternalExamDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [showLobby, setShowLobby] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmedDetails, setConfirmedDetails] = useState<Record<string, boolean>>({})
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({})

  const fetchProgress = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/student/exams/internal/progress')
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.error || 'Could not load your internal exam progress.')
      }
    } catch {
      setError('Could not connect to the exam server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProgress() }, [fetchProgress])

  useEffect(() => {
    const bankId = searchParams.get('bankId')
    if (!bankId || !data?.bankProgress.some(bank => bank.bankId === bankId)) return
    setShowLobby(bankId)
  }, [data?.bankProgress, searchParams])

  const handleStartExam = async (bankId: string) => {
    const bank = data?.bankProgress.find((item) => item.bankId === bankId)
    const categoryCode = bank?.categoryCode || selectedCategories[bankId] || ''
    if (bank && !bank.categoryCode && data?.studentDetails.targetCategories.length && !categoryCode) {
      setError('Select the licence category for this internal exam attempt.')
      return
    }

    setStarting(bankId)
    setError(null)
    try {
      const res = await fetch('/api/student/exams/internal/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankId, categoryCode: categoryCode || undefined }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        router.push(`/student/exams/internal/${json.data.sessionId}`)
      } else {
        setError(json.error || 'Failed to start exam. Check your eligibility and try again.')
      }
    } catch {
      setError('Could not connect to the exam server. Check your connection and try again.')
    } finally {
      setStarting(null)
      setShowLobby(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
      </div>
    )
  }

  const now = new Date()
  const dateFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  const formatOptionalDate = (value: string | null) => value ? dateFormatter.format(new Date(value)) : 'Not recorded'

  if (!data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Internal exams are unavailable</p>
            <p className="mt-1">{error || 'Your exam progress could not be loaded.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {data.completionWindow && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">10-Year Completion Window</h3>
            <span className={`text-xs font-bold ${data.completionWindow.percentElapsed > 80 ? 'text-red-600' : 'text-slate-500'}`}>
              {data.completionWindow.remainingDays} days remaining
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                data.completionWindow.percentElapsed > 80 ? 'bg-red-500'
                : data.completionWindow.percentElapsed > 60 ? 'bg-amber-500'
                : 'bg-blue-800'
              }`}
              style={{ width: `${data.completionWindow.percentElapsed}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between gap-4 text-[10px] text-slate-400">
            <span>Started: {dateFormatter.format(new Date(data.completionWindow.startDate))}</span>
            <span>Deadline: {dateFormatter.format(new Date(data.completionWindow.deadline))}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto h-5 w-5 text-slate-400" />
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{data.summary.totalModules}</p>
          <p className="text-xs text-slate-500">Total Modules</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-800/50 dark:bg-green-900/10">
          <Trophy className="mx-auto h-5 w-5 text-green-600" />
          <p className="mt-1 text-2xl font-bold text-green-800 dark:text-green-200">{data.summary.passedModules}</p>
          <p className="text-xs text-green-600">Passed</p>
        </div>
        <div className="rounded-xl border border-blue-800/20 bg-blue-50 p-4 text-center dark:border-blue-800/50 dark:bg-blue-900/10">
          <CheckCircle2 className="mx-auto h-5 w-5 text-blue-800" />
          <p className="mt-1 text-2xl font-bold text-aerojet-blue">{data.summary.progressPercent}%</p>
          <p className="text-xs text-slate-500">Complete</p>
        </div>
      </div>

      <div className="space-y-3">
        {data.bankProgress.map((bank) => {
          const canTake = bank.totalAttempts === 0

          return (
            <div key={bank.bankId} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    bank.passed && bank.isPublished ? 'bg-green-100 dark:bg-green-900/30'
                    : bank.pendingReview ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {bank.passed && bank.isPublished ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                      : bank.pendingReview ? <Hourglass className="h-5 w-5 text-amber-600" />
                      : <BookOpen className="h-5 w-5 text-slate-400" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-slate-900 dark:text-white">
                      {bank.moduleCode || bank.courseCode}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {bank.courseCode}
                      {bank.categoryCode && ` · Cat ${bank.categoryCode}`}
                      {bank.totalAttempts > 0 && ` · ${bank.totalAttempts} attempt${bank.totalAttempts !== 1 ? 's' : ''}`}
                      {bank.isPublished && bank.bestScore > 0 && ` · Best: ${bank.bestScore}%`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {bank.passed && bank.isPublished && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Passed
                    </span>
                  )}
                  {bank.pendingReview && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      Pending Review
                    </span>
                  )}
                  {canTake && (
                    <button
                      onClick={() => setShowLobby(bank.bankId)}
                      disabled={starting === bank.bankId}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-800 px-4 py-2 text-xs font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50 dark:bg-sky-400"
                    >
                      {starting === bank.bankId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          Start Exam
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {showLobby === bank.bankId && (
                <div className="border-t border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Confirm Candidate Details</p>
                        <dl className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                          <div><dt className="font-bold text-slate-400">Name</dt><dd>{data.studentDetails.name}</dd></div>
                          <div><dt className="font-bold text-slate-400">Student ID</dt><dd>{data.studentDetails.studentId || 'Not assigned'}</dd></div>
                          <div><dt className="font-bold text-slate-400">Email</dt><dd className="break-all">{data.studentDetails.email}</dd></div>
                          <div><dt className="font-bold text-slate-400">Date of Birth</dt><dd>{formatOptionalDate(data.studentDetails.dateOfBirth)}</dd></div>
                          <div><dt className="font-bold text-slate-400">Phone</dt><dd>{data.studentDetails.phone || 'Not recorded'}</dd></div>
                          <div><dt className="font-bold text-slate-400">Programme</dt><dd>{data.studentDetails.programmeChoice || data.studentDetails.enrollmentType || 'Not recorded'}</dd></div>
                          <div><dt className="font-bold text-slate-400">Licence Target</dt><dd>{bank.categoryCode || selectedCategories[bank.bankId] || data.studentDetails.targetCategories.join(', ') || 'Not recorded'}</dd></div>
                        </dl>
                      </div>
                      <label className="flex max-w-sm items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={!!confirmedDetails[bank.bankId]}
                          onChange={(event) => setConfirmedDetails(prev => ({ ...prev, [bank.bankId]: event.target.checked }))}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-aerojet-blue focus:ring-blue-800"
                        />
                        <span>I confirm these details are correct for this exam attempt.</span>
                      </label>
                    </div>
                  </div>
                  {!bank.categoryCode && data.studentDetails.targetCategories.length > 0 && (
                    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
                        Licence Category for This Attempt
                      </label>
                      <select
                        value={selectedCategories[bank.bankId] || ''}
                        onChange={(event) => setSelectedCategories(prev => ({ ...prev, [bank.bankId]: event.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="">Select category</option>
                        {data.studentDetails.targetCategories.map((category) => (
                          <option key={category} value={category}>Category {category}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/10">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <div className="text-sm">
                        <p className="font-bold text-amber-800 dark:text-amber-200">Exam Rules - Please Read Carefully</p>
                        <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                          <li>- <strong>Single Attempt ONLY</strong> - You can only take this internal exam once. There are no retakes.</li>
                          <li>- <strong>Timer Starts Immediately</strong> - The countdown begins the moment you confirm and start.</li>
                          <li>- <strong>3-option MCQ</strong> - Each question has exactly 3 answer options (A, B, C)</li>
                          <li>- <strong>75 seconds per question</strong> - Timer limits are strictly enforced.</li>
                          <li>- <strong>75% pass mark</strong> - You must score at least 75% to pass.</li>
                          <li>- <strong>Keyboard auto-submit</strong> - Any keyboard press during the exam submits the attempt when this rule is enabled</li>
                          <li>- <strong>Auto-submit</strong> - The exam will auto-submit when time expires</li>
                          <li>- <strong>Answers are auto-saved</strong> - Your progress is saved as you answer</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                      Attempt 1 of 1
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowLobby(null)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleStartExam(bank.bankId)}
                        disabled={
                          starting === bank.bankId ||
                          !confirmedDetails[bank.bankId] ||
                          (!bank.categoryCode && data.studentDetails.targetCategories.length > 0 && !selectedCategories[bank.bankId])
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-aerojet-blue px-6 py-2 text-xs font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50"
                      >
                        {starting === bank.bankId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'I Understand - Begin Exam'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
