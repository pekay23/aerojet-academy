'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, X } from 'lucide-react'

const ATTEMPT_TYPES = [
  { value: 'FIRST', label: '1st Attempt' },
  { value: 'RESIT_1', label: 'Resit (2nd)' },
  { value: 'RESIT_2', label: 'Resit (3rd)' },
  { value: 'RESIT_3', label: 'Resit (4th+)' },
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
  const [notes, setNotes] = useState('')

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

  const handleSubmit = async () => {
    if (!moduleId) {
      toast.error('Please select a module')
      return
    }
    if (!examDate) {
      toast.error('Please enter an exam date')
      return
    }

    const parsedScore = score ? Number(score) : undefined
    const result = parsedScore !== undefined ? (parsedScore >= 75 ? 'pass' : 'fail') : undefined

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
            },
          ],
          bookingType: 'INDIVIDUAL',
          examDate,
          attemptType,
          notes,
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
    setNotes('')
  }

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-black text-slate-800 dark:text-white">Add Exam Record</h2>
              <button
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <p className="text-sm text-slate-500">
                Add a historical exam record for <span className="font-bold">{studentName}</span>.
              </p>

              {/* Module */}
              <div>
                <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Module
                </label>
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">— Select module —</option>
                  {sortedModules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.course?.code || m.code} — {m.course?.name || m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Date */}
              <div>
                <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* Score (optional) */}
              <div>
                <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Score (optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Leave empty for pending"
                    min={0}
                    max={100}
                    className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span className="text-sm text-slate-400">%</span>
                  {score && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                        Number(score) >= 75
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {Number(score) >= 75 ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Leave empty if exam is pending (not yet taken)
                </p>
              </div>

              {/* Attempt Type */}
              <div>
                <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Attempt Type
                </label>
                <select
                  value={attemptType}
                  onChange={(e) => setAttemptType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  {ATTEMPT_TYPES.map((at) => (
                    <option key={at.value} value={at.value}>
                      {at.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about this exam..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
              <button
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !moduleId || !examDate}
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
