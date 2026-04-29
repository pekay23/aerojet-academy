'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, X, CheckCircle, XCircle, Clock } from 'lucide-react'

const ATTEMPT_TYPES = [
  { value: 'FIRST', label: '1st Attempt' },
  { value: 'RESIT_1', label: 'Resit (2nd)' },
  { value: 'RESIT_2', label: 'Resit (3rd)' },
  { value: 'RESIT_3', label: 'Resit (4th+)' },
]

const RESULT_OPTIONS = [
  { value: 'auto', label: 'Auto (derive from score)' },
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'pending', label: 'Pending (not yet taken)' },
  { value: 'deferred', label: 'Deferred' },
  { value: 'absent', label: 'Absent' },
]

interface Props {
  studentId: string
  studentName: string
  examComponents: {
    id: string
    code: string
    name: string
    course?: { id: string; name: string; code: string }
  }[]
  onSuccess: () => void
}

export default function AddExamRecordDialog({
  studentId,
  studentName,
  examComponents,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [moduleId, setModuleId] = useState('')
  const [examDate, setExamDate] = useState('')
  const [score, setScore] = useState<string>('')
  const [attemptType, setAttemptType] = useState('FIRST')
  const [examCategory, setExamCategory] = useState('OFFICIAL_EASA')
  const [resultOverride, setResultOverride] = useState('auto')
  const [notes, setNotes] = useState('')
  const [isFinalized, setIsFinalized] = useState(true)

  const sortedModules = useMemo(() => {
    const seenCourse = new Set<string>()
    return examComponents
      .filter((ec) => {
        const courseId = ec.course?.id || ec.id
        if (seenCourse.has(courseId)) return false
        seenCourse.add(courseId)
        return true
      })
      .sort((a, b) => {
        const codeA = a.course?.code || a.code || ''
        const codeB = b.course?.code || b.code || ''
        const numA = parseInt(codeA.replace(/\D/g, '') || '0', 10)
        const numB = parseInt(codeB.replace(/\D/g, '') || '0', 10)
        if (numA && numB) return numA - numB
        return codeA.localeCompare(codeB)
      })
  }, [examComponents])

  const selectedModule = examComponents.find((m) => m.id === moduleId)

  // Compute what result will actually be submitted
  const computedResult = useMemo(() => {
    if (resultOverride !== 'auto') return resultOverride === 'pending' ? undefined : resultOverride
    if (score !== '') {
      return Number(score) >= 75 ? 'pass' : 'fail'
    }
    return undefined // pending
  }, [resultOverride, score])

  // Display hint for what the result will be
  const resultHint = useMemo(() => {
    if (resultOverride !== 'auto') {
      return RESULT_OPTIONS.find((r) => r.value === resultOverride)?.label || ''
    }
    if (score !== '') {
      return Number(score) >= 75 ? 'Will be marked PASS (≥75%)' : 'Will be marked FAIL (<75%)'
    }
    return 'Will be marked as Pending (no score)'
  }, [resultOverride, score])

  const handleSubmit = async () => {
    if (!moduleId) {
      toast.error('Please select a module')
      return
    }
    if (!examDate && resultOverride !== 'pending') {
      toast.error('Please enter an exam date, or set result to Pending')
      return
    }

    const parsedScore = score ? Number(score) : undefined

    setLoading(true)
    try {
      const res = await fetch('/api/staff/students/' + studentId + '/exam-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [
            {
              courseId: selectedModule?.course?.id,
              moduleCode: selectedModule?.course?.code || selectedModule?.code,
              score: parsedScore,
              resultOverride: resultOverride !== 'auto' && resultOverride !== 'pending' ? resultOverride : undefined,
            },
          ],
          bookingType: 'INDIVIDUAL',
          examDate: examDate || null,
          attemptType,
          examCategory,
          notes,
          isPending: !isFinalized || resultOverride === 'pending' || (!score && resultOverride === 'auto'),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to add exam record')
        return
      }

      toast.success('Exam record added successfully!')
      setOpen(false)
      resetForm()
      onSuccess()
    } catch {
      toast.error('Failed to add exam record. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setModuleId('')
    setExamDate('')
    setScore('')
    setAttemptType('FIRST')
    setExamCategory('OFFICIAL_EASA')
    setResultOverride('auto')
    setNotes('')
  }

  const resultColor =
    computedResult === 'pass'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : computedResult === 'fail'
        ? 'text-red-600 bg-red-50 border-red-200'
        : 'text-slate-500 bg-slate-50 border-slate-200'

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:border-aerojet-sky hover:text-aerojet-sky dark:border-slate-700 dark:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Record
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white">Add Exam Record</h2>
                <p className="text-xs text-slate-400">For: <span className="font-bold text-slate-600 dark:text-slate-300">{studentName}</span></p>
              </div>
              <button
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Module */}
              <div>
                <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Module <span className="text-red-500">*</span>
                </label>
                <select
                  id="exam-record-module"
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-aerojet-blue focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">— Select module —</option>
                  {sortedModules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.course?.code || m.code} — {m.course?.name || m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Category + Attempt Type (2 col) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                    Exam Category
                  </label>
                  <select
                    id="exam-record-category"
                    value={examCategory}
                    onChange={(e) => setExamCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-aerojet-blue focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="OFFICIAL_EASA">Official EASA</option>
                    <option value="INTERNAL">Academy Internal</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                    Attempt Type
                  </label>
                  <select
                    id="exam-record-attempt"
                    value={attemptType}
                    onChange={(e) => setAttemptType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-aerojet-blue focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {ATTEMPT_TYPES.map((at) => (
                      <option key={at.value} value={at.value}>
                        {at.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exam Date */}
              <div>
                <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Exam Date
                </label>
                <input
                  id="exam-record-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-aerojet-blue focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-[10px] text-slate-400">Leave empty for pending/future exams</p>
              </div>

              {/* Score + Result Override (2 col) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                    Score (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="exam-record-score"
                      type="number"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="0–100"
                      min={0}
                      max={100}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm focus:border-aerojet-blue focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                    Result Override
                  </label>
                  <select
                    id="exam-record-result"
                    value={resultOverride}
                    onChange={(e) => setResultOverride(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-aerojet-blue focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {RESULT_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                <div>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Finalize Record</p>
                  <p className="text-[10px] text-slate-400">Mark as completed and update academic history</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFinalized(!isFinalized)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isFinalized ? 'bg-aerojet-blue' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isFinalized ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* Result Preview */}
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold ${resultColor}`}>
                {computedResult === 'pass' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : computedResult === 'fail' ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                {resultHint}
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Notes (optional)
                </label>
                <textarea
                  id="exam-record-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about this exam..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-aerojet-blue focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
              <button
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:shadow-sm dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !moduleId}
                className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-6 py-2 text-sm font-bold text-white transition-all hover:bg-[#001f45] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Record
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
