'use client'

import { useState, useMemo, useCallback } from 'react'
import { naturalCompare } from '@/lib/utils/array'
import { useCurrentRole } from '@/hooks/use-current-role'
import {
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  FileCheck,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { updateExamBooking, updateExamResult, deleteExamRecord } from '@/app/staff/actions/index'
import BookExamForStudentDialog from './BookExamForStudentDialog'
import AddExamRecordDialog from './AddExamRecordDialog'
import CertificateReleaseControl from './CertificateReleaseControl'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  deriveBookingDisplayResult,
  isUpcomingBooking as isUpcomingBookingFromLib,
  isMissedBooking as isMissedBookingFromLib,
} from '@/lib/exams/fulfillment'
import {
  ATTEMPT_FIRST,
  ATTEMPT_LABELS,
  ATTEMPT_RESIT_1,
  ATTEMPT_RESIT_2,
  formatAttemptType,
  normalizeAttemptType,
  type AttemptType,
} from '@/lib/exams/attempt-types'
import type { SerializedExamComponent, SerializedExamBundle } from '@/lib/types/staff'

const EXAM_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'passed', label: 'Passed' },
  { key: 'failed', label: 'Failed' },
  { key: 'resit', label: 'Resits' },
  { key: 'internal', label: 'Internal' },
  { key: 'official', label: 'Official EASA' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'missed', label: 'Missed / Unresolved' },
  { key: 'completed', label: 'Completed' },
] as const

type ExamFilter = (typeof EXAM_FILTERS)[number]['key']

type StudentSummary = {
  id: string
  email: string
  profile: { firstName: string; lastName: string } | null
  studentProfile: {
    studentId: string | null
    enrollmentType: string | null
    enrollmentDate: string | null
    studyPathwayLocked: boolean
    studyPathwayLockedAt: string | null
    fundingSource: string | null
    currentYearNumber: number | null
    currentSemesterNumber: number | null
    programmeChoice: string | null
    certificatesReleased: boolean
    documentsReleased: boolean
    pathwayRel?: { code: string; name: string } | null
    academicYear?: { id: string; name: string } | null
    semester?: { id: string; name: string } | null
    licenseTargets?: { licenseCategory: { name?: string | null; code?: string | null } | null }[]
    academicYearId?: string | null
    semesterId?: string | null
    CGPA?: number | null
  } | null
  wallet: {
    availableBalance: number
    reservedBalance: number
    balance: number
    currency: string
  } | null
  examBookings:
    | {
        id: string
        moduleCode: string
        examDate: string | null
        score: number | null
        percentage: number | null
        result: string | null
        status: string
        bookingType: string | null
        attemptType: string | null
        examCategory: string | null
        amountPaid: number | null
        isResit: boolean
        eventName: string | null
        sittingLabel: string | null
        attendanceStatus: string | null
        bookedAt?: string | null
        createdAt?: string
        demandStatus?: string | null
        executedAt?: string | null
        rolloverToEventId?: string | null
        examAttendance?: { status?: string | null } | null
        sittingAssignments?:
          | {
              attendanceStatus?: string | null
              sitting?: { dayNumber?: number; sessionType?: string } | null
            }[]
          | null
        course?: { id?: string; name: string; code: string } | null
        exam?: {
          name?: string | null
          examDate?: string | Date | null
          examComponent?: {
            course?: { id?: string; name: string; code: string } | null
          } | null
        } | null
        event?: {
          id?: string
          name: string
          startDate?: string | null
          endDate?: string | null
          status?: string | null
        } | null
      }[]
    | null
  examResults:
    | {
        id: string
        moduleCode: string
        score: number
        maxScore: number
        percentage: number
        passed: boolean
        attemptType: string | null
        sourceNotes: string | null
        certificateUrl: string | null
        examCategory: string | null
        createdAt?: string
        exam?: {
          name?: string | null
          examDate?: string | Date | null
          examComponent?: {
            course?: { id?: string; code?: string; name?: string } | null
          } | null
        } | null
      }[]
    | null
  examBundles:
    | {
        id: string
        bundleType: string
        usedSeats: number
        totalSeats: number
        amountPaid: number
        status: string
        validUntil: string | null
        createdAt?: string
      }[]
    | null
}

export type UnifiedExamRecord = {
  id: string
  source: 'booking' | 'result'
  moduleCode: string
  examName: string
  examDate: string | null | undefined
  courseId?: string | null
  score: number | null
  percentage: number | null
  result: string | null
  passed: boolean
  status: string
  bookingType: string | null
  attemptType: string | null
  isResit: boolean
  eventName: string | null | undefined
  eventStatus?: string | null | undefined
  bookedAt: string | null | undefined
  amountPaid: number
  examCategory: string | null | undefined
  attendanceStatus: string | null
  demandStatus?: string | null | undefined
  sittingLabel?: string | null
  hasResult?: boolean
  resultId?: string
  sourceNotes?: string | null
  certificateUrl?: string | null
}

function getAttemptLabel(value: string | null | undefined): string {
  return formatAttemptType(value)
}

function isFirstAttemptType(value: string | null | undefined): boolean {
  return getAttemptLabel(value) === ATTEMPT_LABELS[ATTEMPT_FIRST]
}

function isResitAttemptType(value: string | null | undefined): boolean {
  const attemptType = normalizeAttemptType(value)
  return (
    attemptType === ATTEMPT_RESIT_1 ||
    attemptType === ATTEMPT_RESIT_2 ||
    (attemptType !== null && attemptType.startsWith('RETAKE_'))
  )
}

interface Props {
  student: StudentSummary
  examComponents: SerializedExamComponent[]
  upcomingEvents: { id: string; name: string; startDate: string; endDate?: string }[]
  academicYears?: { id: string; name: string }[]
  semesters?: { id: string; name: string }[]
  onRefresh: () => void
}

export default function ExamsTab({
  student,
  examComponents,
  upcomingEvents,
  academicYears,
  semesters,
  onRefresh,
}: Props) {
  const userRole = useCurrentRole()
  const isSupervisor = ['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')
  const [filter, setFilter] = useState<ExamFilter>('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    score?: number
    result?: string
    examDate?: string
    moduleCode?: string
    attemptType?: string
    bookingType?: string
    examCategory?: string
  }>({})
  const [quickAddModule, setQuickAddModule] = useState<SerializedExamComponent | null>(null)
  const [sortBy, setSortBy] = useState<'moduleCode' | 'examDate' | 'score' | 'result'>('examDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  // Merge exam bookings and exam results into unified history
  const allExamRecords = useMemo(() => {
    const records: UnifiedExamRecord[] = []

    // From examBookings
    for (const b of student.examBookings || []) {
      const moduleCode =
        b.moduleCode || b.course?.code || b.exam?.examComponent?.course?.code || '—'

      const examDate =
        b.examDate ||
        b.bookedAt ||
        b.event?.startDate ||
        (b.exam?.examDate
          ? typeof b.exam.examDate === 'string'
            ? b.exam.examDate
            : (b.exam.examDate?.toISOString() ?? null)
          : null)

      records.push({
        id: b.id,
        source: 'booking',
        moduleCode,
        examName:
          b.exam?.name || b.course?.name || b.exam?.examComponent?.course?.name || 'Manual Record',
        examDate,
        courseId: b.course?.id || null,
        score: b.score != null ? Number(b.score) : null,
        percentage: b.percentage != null ? Number(b.percentage) : null,
        result:
          b.result?.toUpperCase().includes('MIGRATE') ||
          b.result?.toUpperCase().includes('HISTORICAL')
            ? null
            : deriveBookingDisplayResult({
                result: b.result,
                demandStatus: b.demandStatus,
                executedAt: b.executedAt,
                rolloverToEventId: b.rolloverToEventId,
                status: b.status,
              }),
        passed: b.result?.toLowerCase() === 'pass',
        status:
          (b.result != null && b.result !== '' && !b.result.toUpperCase().includes('MIGRATE')) ||
          (b.score != null && examDate && new Date(examDate) < new Date())
            ? 'COMPLETED'
            : b.status,
        bookingType: b.bookingType,
        attemptType: normalizeAttemptType(b.attemptType),
        isResit: b.isResit || isResitAttemptType(b.attemptType),
        eventName: b.event?.name,
        eventStatus: b.event?.status || null,
        demandStatus: b.demandStatus || null,
        bookedAt: b.bookedAt,
        amountPaid: Number(b.amountPaid || 0),
        examCategory: b.examCategory,
        attendanceStatus:
          b.examAttendance?.status || b.sittingAssignments?.[0]?.attendanceStatus || null,
        sittingLabel: b.sittingAssignments?.[0]?.sitting
          ? `Day ${b.sittingAssignments[0].sitting.dayNumber} ${b.sittingAssignments[0].sitting.sessionType}`
          : null,
      })
    }

    // From examResults (formal results)
    for (const r of student.examResults || []) {
      const rModuleCode = r.moduleCode || r.exam?.examComponent?.course?.code || '—'
      const normalizedResultAttemptType = normalizeAttemptType(r.attemptType)
      const existingBooking = records.find(
        (rec) =>
          rec.source === 'booking' &&
          rec.moduleCode?.toUpperCase() === rModuleCode.toUpperCase() &&
          (normalizeAttemptType(rec.attemptType) ?? ATTEMPT_FIRST) ===
            (normalizedResultAttemptType ?? ATTEMPT_FIRST)
      )

      if (existingBooking) {
        // Consolidate: Merge the score from ExamResult into the booking
        existingBooking.score = Number(r.score)
        existingBooking.percentage = Number(r.percentage)
        existingBooking.passed = r.passed
        existingBooking.result = r.passed ? 'pass' : 'fail'
        existingBooking.status = 'COMPLETED'
        existingBooking.hasResult = true
        existingBooking.resultId = r.id
        existingBooking.sourceNotes = r.sourceNotes
        existingBooking.examCategory = r.examCategory || existingBooking.examCategory
        // Treat "migrated" or "historical" results as pending for UI display purposes
        if (
          existingBooking.result?.toUpperCase().includes('MIGRATE') ||
          existingBooking.result?.toUpperCase().includes('HISTORICAL')
        ) {
          existingBooking.result = null
        }

        const normalizedResultAttemptType = normalizeAttemptType(r.attemptType)
        const normalizedBookingAttemptType = normalizeAttemptType(existingBooking.attemptType)

        if (normalizedResultAttemptType) {
          existingBooking.attemptType = normalizedResultAttemptType
          existingBooking.isResit = isResitAttemptType(normalizedResultAttemptType)
        } else if (!normalizedBookingAttemptType && r.attemptType) {
          existingBooking.attemptType = null
          existingBooking.isResit = false
        }
      } else {
        records.push({
          id: `result_${r.id}`,
          source: 'result',
          moduleCode: rModuleCode,
          examName: r.exam?.name || 'Manual Result',
          examDate: r.exam?.examDate != null ? String(r.exam.examDate) : undefined,
          score: Number(r.score),
          percentage: Number(r.percentage),
          result: r.passed ? 'pass' : 'fail',
          passed: r.passed,
          status: 'COMPLETED',
          bookingType: null,
          attemptType: normalizeAttemptType(r.attemptType),
          isResit: isResitAttemptType(r.attemptType),
          eventName: null,
          sourceNotes: r.sourceNotes,
          bookedAt: r.createdAt,
          certificateUrl: r.certificateUrl,
          amountPaid: 0,
          examCategory: r.examCategory,
          attendanceStatus: null,
        })
      }
    }

    // Sort by date descending
    records.sort((a, b) => {
      const da = a.examDate ? new Date(a.examDate).getTime() : 0
      const db = b.examDate ? new Date(b.examDate).getTime() : 0
      return db - da
    })

    return records
  }, [student.examBookings, student.examResults])

  // ---- Upcoming / Missed helpers ----
  const isUpcomingBooking = useCallback(
    (r: UnifiedExamRecord) =>
      isUpcomingBookingFromLib({
        examDate: r.examDate,
        result: r.result,
        demandStatus: r.demandStatus,
        eventStatus: r.eventStatus,
      }),
    []
  )

  const isMissedBooking = useCallback(
    (r: UnifiedExamRecord) =>
      isMissedBookingFromLib({
        examDate: r.examDate,
        result: r.result,
        score: r.score,
        demandStatus: r.demandStatus,
        hasResult: r.hasResult,
      }),
    []
  )

  // Apply filters
  const filteredRecords = useMemo(() => {
    let filtered = allExamRecords

    if (filter === 'passed') {
      filtered = filtered.filter((r) => r.passed || r.result?.toLowerCase() === 'pass')
    } else if (filter === 'failed') {
      filtered = filtered.filter((r) => !r.passed && r.result?.toLowerCase() === 'fail')
    } else if (filter === 'resit') {
      filtered = filtered.filter((r) => r.isResit || isResitAttemptType(r.attemptType))
    } else if (filter === 'upcoming') {
      filtered = filtered.filter((r) => isUpcomingBooking(r))
    } else if (filter === 'missed') {
      filtered = filtered.filter((r) => isMissedBooking(r))
    } else if (filter === 'completed') {
      filtered = filtered.filter((r) => r.status === 'COMPLETED')
    } else if (filter === 'official') {
      filtered = filtered.filter((r) => r.examCategory === 'OFFICIAL_EASA')
    }

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (r) => r.moduleCode?.toLowerCase().includes(q) || r.examName?.toLowerCase().includes(q)
      )
    }

    // Apply sorting with natural sort for module codes
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'moduleCode') {
        cmp = naturalCompare(a.moduleCode || '', b.moduleCode || '')
      } else if (sortBy === 'examDate') {
        const dateA = a.examDate ? new Date(a.examDate).getTime() : 0
        const dateB = b.examDate ? new Date(b.examDate).getTime() : 0
        cmp = dateA - dateB
      } else if (sortBy === 'score') {
        cmp = (a.score ?? -1) - (b.score ?? -1)
      } else if (sortBy === 'result') {
        cmp = (a.result || '').localeCompare(b.result || '')
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })

    return sorted
  }, [allExamRecords, filter, search, sortBy, sortOrder, isMissedBooking, isUpcomingBooking])

  // Filter counts
  const counts = useMemo(
    () => ({
      all: allExamRecords.length,
      passed: allExamRecords.filter((r) => r.passed || r.result?.toLowerCase() === 'pass').length,
      failed: allExamRecords.filter((r) => !r.passed && r.result?.toLowerCase() === 'fail').length,
      resit: allExamRecords.filter((r) => r.isResit || isResitAttemptType(r.attemptType)).length,
      upcoming: allExamRecords.filter((r) => isUpcomingBooking(r)).length,
      missed: allExamRecords.filter((r) => isMissedBooking(r)).length,
      completed: allExamRecords.filter((r) => r.status === 'COMPLETED').length,
      internal: allExamRecords.filter((r) => r.examCategory === 'INTERNAL').length,
      official: allExamRecords.filter((r) => r.examCategory === 'OFFICIAL_EASA').length,
    }),
    [allExamRecords, isMissedBooking, isUpcomingBooking]
  )

  // Handle inline edit save
  const handleSaveEdit = async (record: UnifiedExamRecord) => {
    try {
      let res: { success: boolean } | { error: string }
      if (record.id.startsWith('result_')) {
        res = await updateExamResult(record.id.replace('result_', ''), {
          score: editData.score,
          result: editData.result,
          examDate: editData.examDate ? new Date(editData.examDate) : undefined,
          moduleCode: editData.moduleCode || undefined,
          attemptType: editData.attemptType || undefined,
          bookingType: editData.bookingType || undefined,
          examCategory:
            (editData.examCategory as 'INTERNAL' | 'OFFICIAL_EASA' | undefined) || undefined,
        })
      } else {
        // Score is an exam OUTCOME, not a booking detail. Only supervisors may
        // write it through the booking path; non-supervisors are routed to
        // updateExamResult (which has its own locked-result gate) instead.
        res = await updateExamBooking(record.id, {
          score: isSupervisor ? editData.score : undefined,
          result: editData.result,
          examDate: editData.examDate ? new Date(editData.examDate) : undefined,
          moduleCode: editData.moduleCode || undefined,
          attemptType: editData.attemptType || undefined,
          bookingType: editData.bookingType || undefined,
          examCategory:
            (editData.examCategory as 'INTERNAL' | 'OFFICIAL_EASA' | undefined) || undefined,
          resultIdToSync: (record as { resultId?: string }).resultId || undefined,
        })
      }
      const succeeded = (res as { success: boolean }).success
      if (!succeeded) {
        toast.error((res as { error: string }).error)
      } else {
        toast.success('Exam record updated')
        setEditingId(null)
        onRefresh()
      }
    } catch {
      toast.error('Failed to update record')
    }
  }

  // Handle delete
  const handleDelete = (recordId: string) => {
    setPendingDeleteId(recordId)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) return
    setShowDeleteConfirm(false)
    try {
      const res = await deleteExamRecord(pendingDeleteId)
      if ('error' in res && res.error) {
        toast.error(res.error)
      } else {
        toast.success('Exam record deleted')
        onRefresh()
      }
    } catch {
      toast.error('Failed to delete record')
    } finally {
      setPendingDeleteId(null)
    }
  }

  // Quick add handlers
  const handleQuickAdd = (module: SerializedExamComponent) => {
    setQuickAddModule(module)
  }

  // Handle column header click for sorting
  const handleSort = (column: 'moduleCode' | 'examDate' | 'score' | 'result') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const handleQuickAddSave = async () => {
    if (!quickAddModule) return

    const moduleCode = quickAddModule.course?.code || quickAddModule.code
    const courseId = quickAddModule.course?.id

    try {
      const res = await fetch('/api/staff/students/' + student.id + '/exam-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [
            {
              courseId,
              moduleCode,
              score: undefined,
            },
          ],
          bookingType: 'INDIVIDUAL',
          examDate: undefined, // Leave date blank for admin to fill
          attemptType: 'FIRST',
          notes: 'Quick added from exam tab',
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Module added! Click edit to add exam date and score.')
        setQuickAddModule(null)
        onRefresh()
      } else {
        toast.error(data.error || 'Failed to add module')
      }
    } catch {
      toast.error('Failed to add module')
    }
  }

  const walletBalance = Number(student.wallet?.availableBalance ?? 0)

  // Build a map of moduleCode → courseId from examComponents for linking
  const courseLookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const ec of examComponents) {
      if (ec.course?.code && ec.course?.id) {
        map.set(ec.course.code.toUpperCase(), ec.course.id)
      }
    }
    return map
  }, [examComponents])

  // Get list of modules that already have records
  const existingModuleCodes = new Set(allExamRecords.map((r) => r.moduleCode).filter(Boolean))

  // Available modules to add (not yet in records)
  const availableModules = examComponents.filter(
    (m) => !existingModuleCodes.has(m.course?.code || m.code)
  )

  return (
    <div className="space-y-6">
      <CertificateReleaseControl
        studentId={student.id}
        fundingSource={student.studentProfile?.fundingSource}
        pathwayCode={student.studentProfile?.pathwayRel?.code}
        initialCertificatesReleased={student.studentProfile?.certificatesReleased ?? false}
        initialDocumentsReleased={student.studentProfile?.documentsReleased ?? false}
      />

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
            Exam Records ({allExamRecords.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <AddExamRecordDialog
            studentId={student.id}
            studentName={
              student.profile
                ? `${student.profile.firstName} ${student.profile.lastName}`
                : student.email
            }
            examComponents={examComponents.map((ec) => ({
              id: ec.id,
              code: ec.code,
              name: ec.name,
              course: ec.course
                ? { id: ec.course.id, name: ec.course.name || '', code: ec.course.code }
                : undefined,
            }))}
            onSuccess={onRefresh}
          />
          <BookExamForStudentDialog
            studentId={student.id}
            studentName={
              student.profile
                ? `${student.profile.firstName} ${student.profile.lastName}`
                : student.email
            }
            walletBalance={walletBalance}
            walletCurrency={student.wallet?.currency || 'EUR'}
            enrollmentType={student.studentProfile?.enrollmentType}
            academicYears={academicYears}
            semesters={semesters}
            examComponents={examComponents.map((ec) => ({
              id: ec.id,
              code: ec.code,
              name: ec.name,
              course: ec.course
                ? { id: ec.course.id, name: ec.course.name || '', code: ec.course.code }
                : undefined,
            }))}
            upcomingEvents={upcomingEvents.map((e) => ({
              ...e,
              endDate: (e as { endDate?: string }).endDate ?? '',
            }))}
            onSuccess={onRefresh}
          />
        </div>
      </div>

      {/* Quick Add Available Modules */}
      {availableModules.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <h4 className="mb-3 text-xs font-black tracking-widest text-slate-400 uppercase">
            Quick Add: Available Modules
          </h4>
          <div className="flex flex-wrap gap-2">
            {availableModules.slice(0, 12).map((module) => (
              <button
                key={module.id}
                onClick={() => handleQuickAdd(module)}
                className="hover:border-aerojet-blue hover:text-aerojet-blue flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all dark:border-slate-600 dark:bg-slate-700"
              >
                <Plus className="h-3 w-3" />
                {module.course?.code || module.code}
              </button>
            ))}
            {availableModules.length > 12 && (
              <span className="px-3 py-1.5 text-xs text-slate-400">
                +{availableModules.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Add Dialog */}
      {quickAddModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold">
              Add {quickAddModule.course?.code || quickAddModule.code}
            </h3>
            <p className="mb-4 text-sm text-slate-500">Module: {quickAddModule.name}</p>
            <p className="mb-4 text-xs text-amber-600">
              You can add the exam date and score later by editing this record.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setQuickAddModule(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAddSave}
                className="bg-aerojet-blue rounded-lg px-4 py-2 text-sm font-medium text-white"
              >
                Add Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs min-w-50 flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search module or exam..."
            className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {EXAM_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'border-aerojet-blue bg-aerojet-blue text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              {f.label}
              <span className="ml-1 opacity-60">({counts[f.key]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryCard
          icon={CheckCircle2}
          label="Passed"
          value={counts.passed}
          color="text-emerald-600"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <SummaryCard
          icon={XCircle}
          label="Failed"
          value={counts.failed}
          color="text-red-600"
          bg="bg-red-50 dark:bg-red-900/20"
        />
        <SummaryCard
          icon={Clock}
          label="Upcoming"
          value={counts.upcoming}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <SummaryCard
          icon={XCircle}
          label="Missed / Unresolved"
          value={counts.missed}
          color="text-amber-600"
          bg="bg-amber-50 dark:bg-amber-900/20"
        />
        <SummaryCard
          icon={FileCheck}
          label="Total Records"
          value={counts.all}
          color="text-slate-600"
          bg="bg-slate-50 dark:bg-slate-800"
        />
      </div>

      {/* Exam Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileCheck className="mb-2 h-10 w-10 text-slate-200" />
          <p className="text-sm font-bold text-slate-400">
            {filter === 'all' ? 'No exam records yet' : `No ${filter} exam records`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50">
                <th
                  className="hover:text-aerojet-blue cursor-pointer px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase"
                  onClick={() => handleSort('moduleCode')}
                >
                  <span className="flex items-center gap-1">
                    Module
                    {sortBy === 'moduleCode' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      ))}
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Exam / Event
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Attempt
                </th>
                <th
                  className="hover:text-aerojet-blue cursor-pointer px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase"
                  onClick={() => handleSort('examDate')}
                >
                  <span className="flex items-center gap-1">
                    Date
                    {sortBy === 'examDate' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      ))}
                  </span>
                </th>
                <th
                  className="hover:text-aerojet-blue cursor-pointer px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase"
                  onClick={() => handleSort('score')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Score
                    {sortBy === 'score' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      ))}
                  </span>
                </th>
                <th
                  className="hover:text-aerojet-blue cursor-pointer px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase"
                  onClick={() => handleSort('result')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Result
                    {sortBy === 'result' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      ))}
                  </span>
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Booking
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className="transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    {editingId === record.id ? (
                      <select
                        value={editData.moduleCode ?? record.moduleCode}
                        onChange={(e) => setEditData((d) => ({ ...d, moduleCode: e.target.value }))}
                        className="w-28 rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                      >
                        {examComponents.map((ec: SerializedExamComponent) => (
                          <option key={ec.id} value={ec.course?.code || ec.code}>
                            {ec.course?.code || ec.code}
                          </option>
                        ))}
                      </select>
                    ) : (
                      (() => {
                        const cid =
                          record.courseId ||
                          courseLookup.get(record.moduleCode?.toUpperCase() || '')
                        return cid ? (
                          <a
                            href={`/staff/courses/${cid}`}
                            className="text-aerojet-blue dark:text-aerojet-sky font-mono font-bold hover:underline"
                          >
                            {record.moduleCode}
                          </a>
                        ) : (
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {record.moduleCode}
                          </span>
                        )
                      })()
                    )}
                  </td>
                  <td className="max-w-50 px-4 py-3 text-xs text-slate-500">
                    <div className="flex flex-col">
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {record.examName}
                      </span>
                      {record.eventName && (
                        <span className="text-[10px] text-slate-400">
                          Event: {record.eventName}
                        </span>
                      )}
                      {record.sittingLabel && (
                        <span className="text-[10px] text-slate-400">
                          Sitting: {record.sittingLabel}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === record.id ? (
                      <select
                        value={editData.examCategory ?? record.examCategory ?? 'OFFICIAL_EASA'}
                        onChange={(e) =>
                          setEditData((d) => ({
                            ...d,
                            examCategory: e.target.value as 'INTERNAL' | 'OFFICIAL_EASA',
                          }))
                        }
                        className="w-24 rounded border border-slate-200 px-1 py-0.5 text-[10px]"
                      >
                        <option value="OFFICIAL_EASA">OFFICIAL EASA</option>
                        <option value="INTERNAL">INTERNAL</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          record.examCategory === 'INTERNAL'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {record.examCategory === 'INTERNAL' ? 'INTERNAL' : 'OFFICIAL EASA'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === record.id ? (
                      <select
                        value={
                          editData.attemptType ??
                          normalizeAttemptType(record.attemptType) ??
                          ATTEMPT_FIRST
                        }
                        onChange={(e) =>
                          setEditData((d) => ({ ...d, attemptType: e.target.value }))
                        }
                        className="w-28 rounded border border-slate-200 px-2 py-1 text-xs"
                      >
                        <option value="FIRST">{ATTEMPT_LABELS[ATTEMPT_FIRST]}</option>
                        <option value="RESIT_1">{ATTEMPT_LABELS[ATTEMPT_RESIT_1]}</option>
                        <option value="RESIT_2">{ATTEMPT_LABELS[ATTEMPT_RESIT_2]}</option>
                        <option value="RETAKE_1">Retake 1</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isFirstAttemptType(record.attemptType)
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {getAttemptLabel(record.attemptType)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {editingId === record.id ? (
                      <input
                        type="date"
                        value={
                          editData.examDate ??
                          (record.examDate
                            ? new Date(record.examDate).toISOString().split('T')[0]
                            : '')
                        }
                        onChange={(e) => setEditData((d) => ({ ...d, examDate: e.target.value }))}
                        className="rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                    ) : record.examDate ? (
                      new Date(record.examDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === record.id ? (
                      <input
                        type="number"
                        value={editData.score ?? record.score ?? ''}
                        onChange={(e) =>
                          setEditData((d) => ({
                            ...d,
                            score: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        disabled={!isSupervisor}
                        title={
                          !isSupervisor
                            ? 'Only ADMIN / SUPER_ADMIN may edit exam scores'
                            : undefined
                        }
                        className={`focus:ring-aerojet-blue/50 w-16 rounded border border-slate-200 px-2 py-1 text-center font-mono text-xs focus:ring-2 focus:outline-none ${!isSupervisor ? 'cursor-not-allowed opacity-50' : ''}`}
                        min={0}
                        max={100}
                      />
                    ) : (
                      <span className="font-mono text-xs font-black">
                        {record.score != null ? `${record.score}%` : '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {record.result ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                          record.result?.toLowerCase() === 'pass'
                            ? 'bg-emerald-100 text-emerald-700'
                            : record.result?.toLowerCase() === 'fail'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {record.result}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === record.id ? (
                      <select
                        value={editData.attemptType}
                        onChange={(e) =>
                          setEditData((d) => ({ ...d, attemptType: e.target.value }))
                        }
                        className="w-28 rounded border border-slate-200 px-2 py-1 text-xs"
                      >
                        <option value="FIRST">{ATTEMPT_LABELS[ATTEMPT_FIRST]}</option>
                        <option value="RESIT_1">{ATTEMPT_LABELS[ATTEMPT_RESIT_1]}</option>
                        <option value="RESIT_2">{ATTEMPT_LABELS[ATTEMPT_RESIT_2]}</option>
                        <option value="RETAKE_1">Retake 1</option>
                        <option value="RETAKE_2">Retake 2</option>
                        <option value="RETAKE_2">Retake 2</option>
                      </select>
                    ) : record.bookingType ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800">
                        {record.bookingType.replace(/_/g, ' ')}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {isMissedBooking(record) && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700 uppercase">
                          MISSED
                        </span>
                      )}
                      {!isMissedBooking(record) && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                            record.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : record.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : record.status === 'FAILED' || record.status === 'NO_SHOW'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {record.status}
                        </span>
                      )}
                      {record.attendanceStatus && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                            record.attendanceStatus === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-600'
                              : record.attendanceStatus === 'ABSENT'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {record.attendanceStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {record.source === 'booking' && (
                      <div className="flex items-center justify-end gap-1">
                        {editingId === record.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(record)}
                              className="rounded bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white transition-colors hover:bg-emerald-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null)
                                setEditData({})
                              }}
                              className="rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(record.id)
                                setEditData({
                                  score: record.score ?? undefined,
                                  moduleCode: record.moduleCode,
                                  examDate: record.examDate
                                    ? new Date(record.examDate).toISOString().split('T')[0]
                                    : '',
                                  result: record.result || undefined,
                                  attemptType:
                                    normalizeAttemptType(record.attemptType) ?? ATTEMPT_FIRST,
                                  bookingType: record.bookingType || 'INDIVIDUAL',
                                  examCategory: record.examCategory || 'OFFICIAL_EASA',
                                })
                              }}
                              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bundles */}
      {(student.examBundles?.length ?? 0) > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-black tracking-widest text-slate-400 uppercase">
            Active Bundles
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(student.examBundles || []).map((bundle: SerializedExamBundle) => (
              <div
                key={bundle.id}
                className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {bundle.bundleType.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                      bundle.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {bundle.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                  <span>
                    Seats: {bundle.usedSeats}/{bundle.totalSeats}
                  </span>
                  <span>Paid: €{Number(bundle.amountPaid).toFixed(2)}</span>
                  {bundle.validUntil && (
                    <span>
                      Valid until:{' '}
                      {new Date(bundle.validUntil).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete exam record"
          description="Are you sure you want to delete this exam record? This action cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className={`rounded-xl border border-slate-100 p-4 dark:border-slate-800 ${bg}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          {label}
        </span>
      </div>
      <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
    </div>
  )
}
