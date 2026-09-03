'use client'
/** Exam Records Dashboard with Pagination and Inline Editing */

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
  Calendar,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  updateExamBooking,
  searchStudents,
  bulkUpdateExamCategory,
  createExamRecord,
  deleteExamRecord,
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
  courseId: string
  code: string
  name: string
  moduleCode: string
  isComponent?: boolean
}

interface ExamRecord {
  id: string
  examId?: string | null
  moduleCode: string | null
  score: any
  maxScore?: any
  percentage?: any
  passed: boolean | null
  grade?: string | null
  attemptType: string | null
  bookingType?: string | null
  source: 'booking' | 'result'
  sourceNotes?: string | null
  migrationRef?: string | null
  isMigrated?: boolean
  certificateUrl?: string | null
  examCategory?: 'INTERNAL' | 'OFFICIAL_EASA' | string
  examDate?: string | Date | null
  dateDisplay?: string | null
  dateDisplayKind?: 'DATE' | 'TBC' | 'TBD'
  sittingLabel?: string | null
  result?: string | null
  displayResult?: string | null
  displayResultKind?: string | null
  createdAt: string | Date
  updatedAt?: string | Date
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
  { value: 'INDIVIDUAL', label: 'Individual Exam (â‚¬520)', seats: 1 },
  { value: 'TWIN_PACK', label: 'Twin Pack (â‚¬980)', seats: 2 },
  { value: 'FOUR_PACK', label: '4-Pack Bundle (â‚¬1900)', seats: 4 },
]

function statusBadgeClass(result?: string | null) {
  const normalized = result?.toUpperCase()
  if (normalized === 'PASS')
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (normalized === 'FAIL') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (normalized === 'ABSENT') return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  if (normalized?.includes('PENDING'))
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  if (normalized?.includes('EXCUSED'))
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  if (normalized === 'MIGRATED')
    return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
  if (normalized === 'SCHEDULED')
    return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
  if (normalized === 'EXECUTED')
    return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (normalized === 'POSTPONED')
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  if (normalized === 'ROLLED FORWARD')
    return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
  if (normalized === 'CANCELLED')
    return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
}

export default function RecordsTab({ records, modules }: RecordsTabProps) {
  const router = useRouter()
  const {
    items: sortedRecords,
    requestSort,
    sortConfig,
  } = useSort(records, {
    key: 'createdAt',
    order: 'desc',
  })

  // Form state
  const [studentQuery, setStudentQuery] = useState('')
  const [studentResults, setStudentResults] = useState<StudentOption[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null)
  const [examDate, setExamDate] = useState('')
  const [score, setScore] = useState('')
  const [attemptType, setAttemptType] = useState('FIRST')
  const [examCategory, setExamCategory] = useState('OFFICIAL_EASA')
  const [notes, setNotes] = useState('')
  const [resultOverride, setResultOverride] = useState('auto')
  const [isPending, setIsPending] = useState(false)
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
  const [editCourseId, setEditCourseId] = useState<string | null>(null)
  const [editBookingType, setEditBookingType] = useState('INDIVIDUAL')
  const [editAttemptType, setEditAttemptType] = useState('FIRST')
  const [editCategory, setEditCategory] = useState<'INTERNAL' | 'OFFICIAL_EASA'>('OFFICIAL_EASA')
  const [editModuleCode, setEditModuleCode] = useState('')
  const [editScore, setEditScore] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editIsMigrated, setEditIsMigrated] = useState(false)
  const [editShowDropdown, setEditShowDropdown] = useState(false)
  const [editCourseQuery, setEditCourseQuery] = useState('')
  const [showEditCourseDropdown, setShowEditCourseDropdown] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Search filter
  const [tableFilter, setTableFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'OFFICIAL_EASA' | 'INTERNAL'>('ALL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Reset pagination when filters change
  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1)
  }, [tableFilter, categoryFilter])

  // Debounced student search
  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    if (studentQuery.length < 2) {
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const seats = BOOKING_TYPES.find((t) => t.value === bookingType)?.seats || 1
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
    setExamCategory('OFFICIAL_EASA')
    setNotes('')
    setResultOverride('auto')
    setIsPending(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) {
      toast.error('Please select a student')
      return
    }

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
    try {
      const res = await createExamRecord({
        userId: selectedStudent.id,
        bookingType,
        examDate,
        attemptType,
        examCategory: examCategory as 'INTERNAL' | 'OFFICIAL_EASA',
        notes: notes.trim() || undefined,
        isPending,
        entries: moduleSelections.map((sel) => ({
          courseId: sel.selected?.courseId,
          examComponentId: sel.selected?.isComponent ? sel.selected?.id : undefined,
          moduleCode: sel.selected?.moduleCode || sel.query,
          score: score ? parseFloat(score) : undefined,
          resultOverride: resultOverride === 'auto' ? undefined : resultOverride,
        })),
      })

      if (res.success) {
        toast.success(
          `Added ${bookingType === 'INDIVIDUAL' ? 'exam record' : 'bundle'} successfully`
        )
        resetForm()
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to add record')
      }
    } finally {
      setIsSubmitting(false)
    }
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
    setEditCourseId(record.examId || null)
    setEditBookingType(record.bookingType || 'INDIVIDUAL')
    setEditAttemptType(record.attemptType || 'FIRST')
    setEditCategory((record.examCategory as 'INTERNAL' | 'OFFICIAL_EASA') || 'OFFICIAL_EASA')
    setEditModuleCode(record.moduleCode || '')
    setEditScore(record.score ? Number(record.score).toString() : '')
    setEditDate(record.examDate ? format(new Date(record.examDate), 'yyyy-MM-dd') : '')
    setEditIsMigrated(!!record.isMigrated)
    const linkedCourse = modules.find((m) => m.id === record.examId)
    setEditCourseQuery(
      linkedCourse ? `${linkedCourse.code} â€” ${linkedCourse.name}` : record.moduleCode || ''
    )
    setShowEditCourseDropdown(false)
  }

  const handleUpdate = async () => {
    if (!editingId) return
    setIsUpdating(true)

    const res = await updateExamBooking(
      editingId.startsWith('result_') ? editingId.replace('result_', '') : editingId,
      {
        courseId: editCourseId || undefined,
        moduleCode: editModuleCode || undefined,
        examDate: editDate ? new Date(editDate) : undefined,
        score: editScore ? Number(editScore) : undefined,
        bookingType: editBookingType as any,
        attemptType: editAttemptType,
        examCategory: editCategory as any,
        isMigrated: editIsMigrated,
      }
    )

    setIsUpdating(false)
    if (res.success) {
      toast.success('Record updated')
      setEditingId(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to update')
    }
  }

  const handleBulkUpdate = async (category: 'INTERNAL' | 'OFFICIAL_EASA') => {
    if (selectedIds.length === 0) {
      toast.error('No records selected')
      return
    }
    setIsBulkUpdating(true)
    try {
      const res = await bulkUpdateExamCategory(selectedIds, category)

      if (res.success) {
        toast.success(`Successfully updated ${selectedIds.length} records`)
        setSelectedIds([])
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to update records')
      }
    } catch (err) {
      console.error('Bulk update exception:', err)
      toast.error('A client-side error occurred')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id))
    }
  }

  const toggleSelectRecord = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const filteredRecords = sortedRecords.filter((r) => {
    const matchesSearch = tableFilter
      ? r.moduleCode?.toLowerCase().includes(tableFilter.toLowerCase()) ||
        r.user.email.toLowerCase().includes(tableFilter.toLowerCase()) ||
        (r.user.profile?.firstName + ' ' + r.user.profile?.lastName)
          .toLowerCase()
          .includes(tableFilter.toLowerCase())
      : true

    const matchesCategory = categoryFilter === 'ALL' || r.examCategory === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Pagination logic
  const totalItems = filteredRecords.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="space-y-8">
      {/* â”€â”€ Add Record Form â”€â”€ */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-aerojet-blue flex h-10 w-10 items-center justify-center rounded-xl text-white">
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
          <div className="relative">
            <label
              htmlFor="form-student-search"
              className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase"
            >
              Student <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="form-student-search"
                type="text"
                value={studentQuery}
                onChange={(e) => {
                  setStudentQuery(e.target.value)
                  if (selectedStudent) setSelectedStudent(null)
                }}
                placeholder="Search by name, email, or student ID..."
                autoComplete="off"
                className="focus:border-aerojet-blue w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm transition-colors focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
              />
              {isSearching && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  <div className="border-t-aerojet-blue h-4 w-4 animate-spin rounded-full border-2 border-slate-300" />
                </div>
              )}
            </div>

            {showDropdown && studentResults.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {studentResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectStudent(s)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/60"
                  >
                    <div className="text-aerojet-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                      {s.firstName.charAt(0)}
                      {s.lastName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {[s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')}
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
            {selectedStudent && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Selected:{' '}
                {[selectedStudent.firstName, selectedStudent.middleName, selectedStudent.lastName]
                  .filter(Boolean)
                  .join(' ')}{' '}
                ({selectedStudent.email})
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="form-booking-type"
                className="mb-1.5 block text-[10px] font-black tracking-widest text-slate-500 uppercase"
              >
                Booking Type <span className="text-red-500">*</span>
              </label>
              <select
                id="form-booking-type"
                value={bookingType}
                onChange={(e) =>
                  setBookingType(e.target.value as 'INDIVIDUAL' | 'TWIN_PACK' | 'FOUR_PACK')
                }
                className="focus:border-aerojet-blue w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold transition-colors focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
              >
                {BOOKING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="form-exam-date"
                className="mb-1.5 block text-[10px] font-black tracking-widest text-slate-500 uppercase"
              >
                Exam Date <span className="text-red-500">*</span>
              </label>
              <input
                id="form-exam-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="focus:border-aerojet-blue w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold transition-colors focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
                required
              />
            </div>
          </div>

          <div className={`grid gap-4 ${bookingType === 'INDIVIDUAL' ? '' : 'sm:grid-cols-2'}`}>
            {moduleSelections.map((selection, idx) => (
              <div key={idx} className="relative">
                <label
                  htmlFor={`form-module-query-${idx}`}
                  className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase"
                >
                  {bookingType === 'INDIVIDUAL' ? 'Module' : `Module ${idx + 1}`}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id={`form-module-query-${idx}`}
                    type="text"
                    value={selection.query}
                    autoComplete="off"
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
                    onBlur={() => {
                      // Small timeout to allow clicking the suggestion
                      setTimeout(() => updateModuleSelection(idx, { showDropdown: false }), 200)
                    }}
                    placeholder="Search module code..."
                    className="focus:border-aerojet-blue w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm font-bold uppercase transition-colors focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
                  />
                  {selection.showDropdown && (
                    <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                      {modules
                        .filter(
                          (m) =>
                            m.code.toLowerCase().includes(selection.query.toLowerCase()) ||
                            m.name.toLowerCase().includes(selection.query.toLowerCase())
                        )
                        .map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              updateModuleSelection(idx, {
                                query: m.moduleCode,
                                selected: m,
                                showDropdown: false,
                              })
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {m.name}
                              </p>
                              <p className="text-[10px] tracking-tighter text-slate-500 uppercase">
                                Code: {m.code}
                              </p>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                Attempt Type
              </label>
              <select
                value={attemptType}
                onChange={(e) => setAttemptType(e.target.value)}
                className="focus:border-aerojet-blue w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
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
                Category
              </label>
              <select
                value={examCategory}
                onChange={(e) => setExamCategory(e.target.value)}
                className="focus:border-aerojet-blue w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="OFFICIAL_EASA">Official EASA</option>
                <option value="INTERNAL">Internal Academy</option>
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
                placeholder="â€”"
                min="0"
                max="100"
                step="0.01"
                className="focus:border-aerojet-blue w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
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
                className="focus:border-aerojet-blue w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Pending Record</p>
                <p className="text-[10px] text-slate-500">Wait for result entry</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPending(!isPending)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isPending ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isPending ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Award className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Result Override</p>
                <select
                  disabled={isPending}
                  value={resultOverride}
                  onChange={(e) => setResultOverride(e.target.value)}
                  className="mt-1 w-full bg-transparent text-[10px] font-bold text-slate-500 focus:outline-hidden disabled:opacity-50"
                >
                  <option value="auto">Auto (from score)</option>
                  <option value="pass">Manual Pass</option>
                  <option value="fail">Manual Fail</option>
                  <option value="deferred">Deferred</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
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
              className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? 'Adding...' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>

      {/* â”€â”€ Records Table â”€â”€ */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCategoryFilter('OFFICIAL_EASA')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                categoryFilter === 'OFFICIAL_EASA'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              Official EASA
            </button>
            <button
              onClick={() => setCategoryFilter('INTERNAL')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                categoryFilter === 'INTERNAL'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Internal Academy
            </button>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              placeholder="Filter by student or module..."
              className="focus:border-aerojet-blue w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-sm transition-colors focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <span>
            <strong>TBC</strong>: final sitting/date is still to be confirmed.
          </span>
          <span>
            <strong>TBD</strong>: no exam date has been set yet.
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="w-10 px-6 py-4">
                    <input
                      type="checkbox"
                      checked={
                        filteredRecords.length > 0 && selectedIds.length === filteredRecords.length
                      }
                      onChange={toggleSelectAll}
                      className="text-aerojet-blue h-4 w-4 rounded border-slate-300"
                    />
                  </th>
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
                    label="Dates"
                    sortKey="examDate"
                    currentSort={sortConfig}
                    onSort={requestSort}
                  />
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Attempt</th>
                  <th className="px-6 py-4">Migrated</th>
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
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-slate-500 italic">
                      No records match.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record) => {
                    const isEditing = editingId === record.id
                    const scoreNum = isEditing
                      ? editScore
                        ? Number(editScore)
                        : null
                      : record.score
                        ? Number(record.score)
                        : null
                    const passed = isEditing
                      ? scoreNum !== null
                        ? scoreNum >= 75
                        : record.passed
                      : record.passed
                    const displayResult =
                      record.displayResult ||
                      record.result ||
                      (passed === true ? 'PASS' : passed === false ? 'FAIL' : 'Pending')

                    return (
                      <tr
                        key={record.id}
                        className={`group border-b border-slate-50 transition-all hover:bg-slate-50/50 ${isEditing ? 'bg-aerojet-blue/5 shadow-inner' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(record.id)}
                            onChange={() => toggleSelectRecord(record.id)}
                            className="text-aerojet-blue h-4 w-4 rounded border-slate-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {[record.user.profile?.firstName, record.user.profile?.lastName]
                              .filter(Boolean)
                              .join(' ')}
                          </p>
                          <p className="text-[10px] text-slate-500">{record.user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="relative">
                              <input
                                type="text"
                                value={editModuleCode}
                                autoComplete="off"
                                onChange={(e) => {
                                  const q = e.target.value.toUpperCase()
                                  setEditModuleCode(q)
                                  setEditShowDropdown(q.length > 0)
                                }}
                                onFocus={() => {
                                  if (editModuleCode.length > 0) setEditShowDropdown(true)
                                }}
                                onBlur={() => setTimeout(() => setEditShowDropdown(false), 200)}
                                className="focus:border-aerojet-blue w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold uppercase focus:outline-hidden"
                              />
                              {editShowDropdown && (
                                <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                  {modules
                                    .filter(
                                      (m) =>
                                        m.code
                                          .toLowerCase()
                                          .includes(editModuleCode.toLowerCase()) ||
                                        m.name.toLowerCase().includes(editModuleCode.toLowerCase())
                                    )
                                    .slice(0, 10)
                                    .map((m) => (
                                      <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                          setEditModuleCode(m.moduleCode)
                                          setEditShowDropdown(false)
                                        }}
                                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                            {m.name}
                                          </p>
                                          <p className="text-[10px] text-slate-500 uppercase">
                                            Code: {m.code}
                                          </p>
                                        </div>
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="font-bold text-slate-700 uppercase">
                              {record.moduleCode}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-900">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="focus:border-aerojet-blue rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] focus:outline-hidden"
                            />
                          ) : (
                            <div>
                              <span
                                className={
                                  record.dateDisplayKind === 'DATE'
                                    ? ''
                                    : 'rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-300'
                                }
                              >
                                {record.dateDisplayKind === 'DATE' && record.examDate
                                  ? format(new Date(record.examDate), 'MMM d, yyyy')
                                  : record.dateDisplay || 'TBD'}
                              </span>
                              {record.sittingLabel && (
                                <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase">
                                  {record.sittingLabel}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <select
                              value={editCategory}
                              onChange={(e) =>
                                setEditCategory(e.target.value as 'INTERNAL' | 'OFFICIAL_EASA')
                              }
                              className="focus:border-aerojet-blue rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] focus:outline-hidden"
                            >
                              <option value="OFFICIAL_EASA">EASA</option>
                              <option value="INTERNAL">Internal</option>
                            </select>
                          ) : (
                            <div
                              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase transition-all ${record.examCategory === 'INTERNAL' ? 'border-indigo-100 bg-indigo-50/50 text-indigo-600' : 'border-blue-100 bg-blue-50/50 text-blue-600'}`}
                            >
                              {record.examCategory === 'INTERNAL' ? (
                                <>
                                  <BookOpen className="h-3 w-3" />
                                  <span>Internal</span>
                                </>
                              ) : (
                                <>
                                  <Award className="h-3 w-3" />
                                  <span>Official EASA</span>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {isEditing ? (
                            <select
                              value={editBookingType}
                              onChange={(e) =>
                                setEditBookingType(
                                  e.target.value as 'INDIVIDUAL' | 'TWIN_PACK' | 'FOUR_PACK'
                                )
                              }
                              className="focus:border-aerojet-blue rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] focus:outline-hidden"
                            >
                              <option value="INDIVIDUAL">IND</option>
                              <option value="TWIN_PACK">TWIN</option>
                              <option value="FOUR_PACK">4-PK</option>
                            </select>
                          ) : (
                            record.bookingType
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <select
                              value={editAttemptType}
                              onChange={(e) => setEditAttemptType(e.target.value)}
                              className="focus:border-aerojet-blue rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] focus:outline-hidden"
                            >
                              {ATTEMPT_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase">
                              {record.attemptType === 'MIGRATED' ? 'â€”' : record.attemptType || 'â€”'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editIsMigrated}
                                onChange={(e) => setEditIsMigrated(e.target.checked)}
                                className="text-aerojet-blue h-4 w-4 rounded border-slate-300"
                              />
                              <span className="text-[10px] font-bold text-slate-500 uppercase">
                                Yes
                              </span>
                            </div>
                          ) : record.isMigrated ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-400">
                              Migrated
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 uppercase">
                              â€”
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${statusBadgeClass(displayResult)}`}
                          >
                            {displayResult}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editScore}
                              onChange={(e) => setEditScore(e.target.value)}
                              className="focus:border-aerojet-blue w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-bold focus:outline-hidden"
                            />
                          ) : scoreNum !== null ? (
                            `${scoreNum.toFixed(0)}%`
                          ) : (
                            'â€”'
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="rounded-lg bg-emerald-500 p-1.5 text-white hover:bg-emerald-600 disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => startEdit(record)}
                                className="hover:text-aerojet-blue p-2 text-slate-400 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="p-2 text-slate-400 transition-colors hover:text-red-500"
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

          {/* â”€â”€ Pagination Controls â”€â”€ */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row dark:border-slate-800 dark:bg-slate-800/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="focus:border-aerojet-blue rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold focus:outline-hidden"
                >
                  {[25, 50, 100, 250, 500].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {(currentPage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.min(currentPage * pageSize, totalItems)}
                </span>{' '}
                of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i + 1
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i)
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 min-w-[32px] rounded-lg border px-2 text-xs font-bold transition-all ${
                        currentPage === pageNum
                          ? 'border-aerojet-blue bg-aerojet-blue text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="ml-2 flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase">Go:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = Number((e.target as HTMLInputElement).value)
                      if (val >= 1 && val <= totalPages) setCurrentPage(val)
                    }
                  }}
                  placeholder={`1-${totalPages}`}
                  className="focus:border-aerojet-blue w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-xs font-bold focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-8 fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-8 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl transition-all dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-4 border-r border-slate-100 pr-6 pl-4 dark:border-slate-800">
            <div className="bg-aerojet-blue flex h-10 w-10 items-center justify-center rounded-xl font-black text-white shadow-lg">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-sm leading-none font-black text-slate-900 dark:text-white">
                Records
              </p>
              <p className="text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                Selected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBulkUpdate('OFFICIAL_EASA')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-lg transition-all hover:bg-blue-700"
            >
              <Award className="h-4 w-4" /> Link to Official EASA
            </button>
            <button
              onClick={() => handleBulkUpdate('INTERNAL')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-lg transition-all hover:bg-indigo-700"
            >
              <BookOpen className="h-4 w-4" /> Link to Internal
            </button>
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
