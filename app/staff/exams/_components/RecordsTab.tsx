'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Search,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FilePlus2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createExamRecord,
  deleteExamRecord,
  updateExamBooking,
  searchStudents,
} from '../../actions'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

interface StudentOption {
  id: string
  email: string
  firstName: string
  middleName?: string | null
  lastName: string
  studentId: string
}

interface ModuleOption {
  id: string
  code: string
  name: string
}

interface ExamRecord {
  id: string
  moduleCode: string | null
  examDate: Date | null
  bookedAt: Date
  status: string
  result: string | null
  score: any
  percentage: any
  attemptType: string | null
  sourceNotes: string | null
  user: {
    email: string
    profile: { firstName: string; middleName?: string | null; lastName: string } | null
    studentProfile: { studentId: string } | null
  }
}

interface RecordsTabProps {
  records: ExamRecord[]
  modules: ModuleOption[]
}

const ATTEMPT_TYPES = [
  { value: 'FIRST', label: '1st Attempt' },
  { value: 'RESIT_1', label: 'Resit (2nd)' },
  { value: 'RESIT_2', label: 'Resit (3rd)' },
  { value: 'RESIT_3', label: 'Resit (4th+)' },
]

const BOOKING_TYPES = [
  { value: 'INDIVIDUAL', label: 'Individual Exam (€520)', seats: 1 },
  { value: 'TWIN_PACK', label: 'Twin Pack (€980)', seats: 2 },
  { value: 'FOUR_PACK', label: '4-Pack Bundle (€1900)', seats: 4 },
]

export default function RecordsTab({ records, modules }: RecordsTabProps) {
  const router = useRouter()
  const {
    items: sortedRecords,
    requestSort,
    sortConfig,
  } = useSort(records, {
    key: 'bookedAt',
    order: 'desc',
  })

  // Form state
  const [studentQuery, setStudentQuery] = useState('')
  const [studentResults, setStudentResults] = useState<StudentOption[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null)
  const [moduleCode, setModuleCode] = useState('')
  const [examDate, setExamDate] = useState('')
  const [score, setScore] = useState('')
  const [attemptType, setAttemptType] = useState('FIRST')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Bundle state
  const [bookingType, setBookingType] = useState<'INDIVIDUAL' | 'TWIN_PACK' | 'FOUR_PACK'>(
    'INDIVIDUAL'
  )
  const [moduleSelections, setModuleSelections] = useState<
    { query: string; selected: ModuleOption | null; showDropdown: boolean }[]
  >([{ query: '', selected: null, showDropdown: false }])

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editModuleCode, setEditModuleCode] = useState('')
  const [editScore, setEditScore] = useState('')
  const [editDate, setEditDate] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Search filter
  const [tableFilter, setTableFilter] = useState('')

  // Debounced student search
  useEffect(() => {
    if (studentQuery.length < 2) {
      setStudentResults([])
      setShowDropdown(false)
      return
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true)
      const res = await searchStudents(studentQuery)
      setStudentResults(res.students)
      setShowDropdown(true)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [studentQuery])

  const updateModuleSelection = (
    index: number,
    updates: Partial<{ query: string; selected: ModuleOption | null; showDropdown: boolean }>
  ) => {
    setModuleSelections((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...updates }
      return next
    })
  }

  // Adjust module slots when booking type changes
  useEffect(() => {
    const seats = BOOKING_TYPES.find((t) => t.value === bookingType)?.seats || 1
    setModuleSelections((prev) => {
      const next = [...prev]
      if (next.length < seats) {
        while (next.length < seats) {
          next.push({ query: '', selected: null, showDropdown: false })
        }
      } else if (next.length > seats) {
        return next.slice(0, seats)
      }
      return next
    })
  }, [bookingType])

  const selectStudent = (student: StudentOption) => {
    setSelectedStudent(student)
    setStudentQuery(
      [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') +
        ` (${student.email})`
    )
    setShowDropdown(false)
  }

  const resetForm = () => {
    setStudentQuery('')
    setSelectedStudent(null)
    setBookingType('INDIVIDUAL')
    setModuleSelections([{ query: '', selected: null, showDropdown: false }])
    setExamDate('')
    setScore('')
    setAttemptType('FIRST')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) {
      toast.error('Please select a student')
      return
    }

    // Validate all module selections
    const invalid = moduleSelections.some((m) => !m.query.trim())
    if (invalid) {
      toast.error('Please fill in all module selections')
      return
    }

    if (!examDate) {
      toast.error('Please enter an exam date')
      return
    }

    setIsSubmitting(true)
    const res = await createExamRecord({
      userId: selectedStudent.id,
      bookingType,
      examDate,
      attemptType,
      notes: notes.trim() || undefined,
      entries: moduleSelections.map((m) => ({
        courseId: m.selected?.id,
        moduleCode: m.selected?.code || m.query.trim(),
        score: score ? Number(score) : undefined,
      })),
    })

    setIsSubmitting(true)
    if (res.success) {
      toast.success(`Added ${bookingType === 'INDIVIDUAL' ? 'exam record' : 'bundle'} successfully`)
      resetForm()
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to add record')
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    const res = await deleteExamRecord(id)
    if (res.success) {
      toast.success('Record deleted')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete')
    }
  }

  const startEdit = (record: ExamRecord) => {
    setEditingId(record.id)
    setEditModuleCode(record.moduleCode || '')
    setEditScore(record.score ? Number(record.score).toString() : '')
    setEditDate(record.examDate ? format(record.examDate, 'yyyy-MM-dd') : '')
  }

  const handleUpdate = async () => {
    if (!editingId) return
    setIsUpdating(true)

    const res = await updateExamBooking(editingId, {
      moduleCode: editModuleCode || undefined,
      examDate: editDate ? new Date(editDate) : undefined,
      score: editScore ? Number(editScore) : undefined,
    })

    setIsUpdating(false)
    if (res.success) {
      toast.success('Record updated')
      setEditingId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to update')
    }
  }

  // Filter records by table search
  const filteredRecords = tableFilter
    ? sortedRecords.filter(
        (r) =>
          r.moduleCode?.toLowerCase().includes(tableFilter.toLowerCase()) ||
          r.user.email.toLowerCase().includes(tableFilter.toLowerCase()) ||
          r.user.profile?.firstName?.toLowerCase().includes(tableFilter.toLowerCase()) ||
          r.user.profile?.lastName?.toLowerCase().includes(tableFilter.toLowerCase()) ||
          r.user.studentProfile?.studentId?.toLowerCase().includes(tableFilter.toLowerCase())
      )
    : sortedRecords

  return (
    <div className="space-y-8">
      {/* ── Add Record Form ── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#002a5c] text-white">
            <FilePlus2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Add Exam Record</h2>
            <p className="text-xs text-slate-500">
              Manually create an exam result for any student. Resit attempts are fully supported.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Student Search */}
          <div className="relative">
            <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
              Student <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentQuery}
                onChange={(e) => {
                  setStudentQuery(e.target.value)
                  if (selectedStudent) setSelectedStudent(null)
                }}
                placeholder="Search by name, email, or student ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm transition-colors focus:border-[#002a5c] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
              />
              {isSearching && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#002a5c]" />
                </div>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && studentResults.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {studentResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectStudent(s)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-[#002a5c]">
                      {s.firstName.charAt(0)}
                      {s.lastName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {[s.firstName, (s as any).middleName, s.lastName].filter(Boolean).join(' ')}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {s.email}
                        {s.studentId && (
                          <span className="ml-2 text-slate-400">ID: {s.studentId}</span>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showDropdown &&
              studentResults.length === 0 &&
              studentQuery.length >= 2 &&
              !isSearching && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  No students found for &quot;{studentQuery}&quot;
                </div>
              )}

            {selectedStudent && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Selected:{' '}
                {[
                  selectedStudent.firstName,
                  (selectedStudent as any).middleName,
                  selectedStudent.lastName,
                ]
                  .filter(Boolean)
                  .join(' ')}{' '}
                ({selectedStudent.email})
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                Booking Type <span className="text-red-500">*</span>
              </label>
              <select
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-[#002a5c] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
              >
                {BOOKING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                Exam Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-[#002a5c] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
                required
              />
            </div>
          </div>

          <div className={`grid gap-4 ${bookingType === 'INDIVIDUAL' ? '' : 'sm:grid-cols-2'}`}>
            {moduleSelections.map((selection, idx) => (
              <div key={idx} className="relative">
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                  {bookingType === 'INDIVIDUAL' ? 'Module' : `Module ${idx + 1}`}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={selection.query}
                    onChange={(e) => {
                      const q = e.target.value
                      updateModuleSelection(idx, {
                        query: q,
                        selected: null,
                        showDropdown: q.length > 0,
                      })
                    }}
                    onFocus={() => {
                      if (selection.query.length > 0)
                        updateModuleSelection(idx, { showDropdown: true })
                    }}
                    placeholder="Search module code..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm font-bold uppercase transition-colors focus:border-[#002a5c] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                {selection.showDropdown && (
                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {modules
                      .filter(
                        (m) =>
                          m.code.toLowerCase().includes(selection.query.toLowerCase()) ||
                          m.name.toLowerCase().includes(selection.query.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            updateModuleSelection(idx, {
                              query: m.code,
                              selected: m,
                              showDropdown: false,
                            })
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                              {m.code}
                            </p>
                            <p className="truncate text-xs text-slate-500">{m.name}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Attempt Type + Score + Notes */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                Attempt Type
              </label>
              <select
                value={attemptType}
                onChange={(e) => setAttemptType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-[#002a5c] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
              >
                {ATTEMPT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                Score (%)
              </label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="—"
                min="0"
                max="100"
                step="0.01"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-[#002a5c] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-[#002a5c] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-[#002a5c] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#002a5c]/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Adding...' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Records Table ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            All Exam Records ({records.length})
          </h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              placeholder="Filter records..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-sm transition-colors focus:border-[#002a5c] focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <SortHeader
                    label="Student"
                    sortKey="user.email"
                    currentSort={sortConfig}
                    onSort={requestSort}
                  />
                  <SortHeader
                    label="Module"
                    sortKey="moduleCode"
                    currentSort={sortConfig}
                    onSort={requestSort}
                  />
                  <SortHeader
                    label="Date"
                    sortKey="examDate"
                    currentSort={sortConfig}
                    onSort={requestSort}
                  />
                  <th className="px-6 py-4">Attempt</th>
                  <th className="px-6 py-4">Result</th>
                  <SortHeader
                    label="Score"
                    sortKey="score"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    align="right"
                  />
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                      {tableFilter
                        ? 'No records match your filter.'
                        : 'No exam records yet. Add one above.'}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const isEditing = editingId === record.id
                    const scoreNum = record.score ? Number(record.score) : null
                    const passed = scoreNum !== null ? scoreNum >= 75 : record.result !== 'fail'

                    return (
                      <tr
                        key={record.id}
                        className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                      >
                        {/* Student */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-[#002a5c]">
                              {record.user.profile?.firstName?.charAt(0)}
                              {record.user.profile?.lastName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {[
                                  record.user.profile?.firstName,
                                  record.user.profile?.middleName,
                                  record.user.profile?.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              </p>
                              <p className="text-[10px] text-slate-500">{record.user.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Module */}
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              value={editModuleCode}
                              onChange={(e) => setEditModuleCode(e.target.value)}
                              className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm uppercase focus:border-[#002a5c] focus:outline-hidden"
                            />
                          ) : (
                            <span className="font-bold text-slate-900 uppercase dark:text-white">
                              {record.moduleCode || '—'}
                            </span>
                          )}
                        </td>
                        {/* Date */}
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-[#002a5c] focus:outline-hidden"
                            />
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">
                              {record.examDate
                                ? format(new Date(record.examDate), 'MMM d, yyyy')
                                : '—'}
                            </span>
                          )}
                        </td>
                        {/* Attempt */}
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${
                              record.attemptType?.startsWith('RESIT')
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {record.attemptType || 'FIRST'}
                          </span>
                        </td>
                        {/* Result */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {passed ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600">
                                  {scoreNum !== null ? 'PASS' : 'AWAITING'}
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                                <span className="text-xs font-bold text-red-600">FAIL</span>
                              </>
                            )}
                          </div>
                        </td>
                        {/* Score */}
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editScore}
                              onChange={(e) => setEditScore(e.target.value)}
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="—"
                              className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm focus:border-[#002a5c] focus:outline-hidden"
                            />
                          ) : scoreNum !== null ? (
                            <span className="font-bold text-slate-900 dark:text-white">
                              {scoreNum.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium tracking-tight text-slate-400 uppercase italic">
                              Record Pending
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="rounded-lg bg-[#002a5c] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#002a5c]/90 disabled:opacity-50"
                              >
                                {isUpdating ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => startEdit(record)}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#002a5c]"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
