'use client'
/** Student Academic History Section with Modular/Exam-Only support */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, BookOpen, FileText, ClipboardList } from 'lucide-react'
import AddExamRecordDialog from '../../../students/[id]/_components/AddExamRecordDialog'

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------


interface ExamBookingData {
  id: string
  moduleCode: string | null
  result: string | null
  score: number | null
  percentage: number | null
  attemptType: string | null
  examDate: string | null
  status: string
  examCategory?: string | null
}

interface StudentProfileData {
  studentId: string
  enrollmentStatus: string
  fundingSource: string
  currentYearNumber: number
  currentSemesterNumber: number
  programmeChoice: string | null
  enrollmentType: string | null
}

interface ExamComponentData {
  id: string
  code: string
  name: string
}

interface Props {
  studentId: string
  studentName: string
  examComponents: ExamComponentData[]
  enrollments: Array<{
    id: string
    status: string
    completedAt: string | null
    course: { code: string; name: string }
  }>
  examBookings: ExamBookingData[]
  studentProfile: StudentProfileData | null
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/** Pathways that don't use academic year / semester enrollments */
const EXAM_PATHWAY_TYPES = ['EXAM_ONLY', 'MODULAR']

function isExamPathway(profile: StudentProfileData): boolean {
  return (
    EXAM_PATHWAY_TYPES.includes(profile.programmeChoice ?? '') ||
    EXAM_PATHWAY_TYPES.includes(profile.enrollmentType ?? '')
  )
}

interface SemesterGroup {
  key: string
  yearName: string
  semesterName: string
  enrollments: Array<{
    id: string
    status: string
    completedAt: string | null
    course: { code: string; name: string }
    academicYear?: { name: string } | null
    semester?: { name: string } | null
  }>
  examResults: Map<string, ExamBookingData[]> // moduleCode -> bookings
}

function groupBySemester(
  enrollments: Array<{
    id: string
    status: string
    completedAt: string | null
    course: { code: string; name: string }
    academicYear?: { name: string } | null
    semester?: { name: string } | null
  }>,
  examBookings: ExamBookingData[]
): SemesterGroup[] {
  const groups = new Map<string, SemesterGroup>()

  for (const e of enrollments) {
    const yearName = e.academicYear?.name || 'Unknown Year'
    const semName = e.semester?.name || 'Unknown Semester'
    const key = `${yearName}::${semName}`

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        yearName,
        semesterName: semName,
        enrollments: [],
        examResults: new Map(),
      })
    }
    groups.get(key)!.enrollments.push(e)
  }

  // Match exam bookings to course codes in each semester
  for (const [, group] of groups) {
    const courseCodes = new Set(group.enrollments.map((e) => e.course.code))
    for (const booking of examBookings) {
      if (booking.moduleCode && courseCodes.has(booking.moduleCode)) {
        if (!group.examResults.has(booking.moduleCode)) {
          group.examResults.set(booking.moduleCode, [])
        }
        group.examResults.get(booking.moduleCode)!.push(booking)
      }
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key))
}

function getCompletenessStatus(group: SemesterGroup): 'complete' | 'partial' | 'empty' {
  const total = group.enrollments.length
  if (total === 0) return 'empty'

  let withResults = 0
  for (const e of group.enrollments) {
    const exams = group.examResults.get(e.course.code) || []
    if (exams.some((ex) => ex.result?.toLowerCase() === 'pass' || ex.result?.toLowerCase() === 'fail')) {
      withResults++
    } else if (exams.length > 0) {
      // Has exam bookings but no final result yet
      withResults += 0.5 
    }
  }

  if (withResults >= total && withResults % 1 === 0) return 'complete'
  if (withResults > 0) return 'partial'
  return 'empty'
}

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Exam-Only / Modular flat exam history
// ---------------------------------------------------------------------------

function ExamOnlyHistory({
  examBookings,
  studentProfile,
  studentId,
  studentName,
  examComponents,
}: {
  examBookings: ExamBookingData[]
  studentProfile: StudentProfileData
  studentId: string
  studentName: string
  examComponents: ExamComponentData[]
}) {
  const router = useRouter()
  const passed = examBookings.filter((b) => b.result?.toLowerCase() === 'pass').length
  const failed = examBookings.filter((b) => b.result?.toLowerCase() === 'fail').length
  const booked = examBookings.filter((b) => b.result && !['pass', 'fail', 'absent'].includes(b.result.toLowerCase())).length
  const pending = examBookings.filter((b) => !b.result || b.status === 'PENDING').length

  const fundingColors: Record<string, string> = {
    SCHOLARSHIP: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    SPONSORED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    SELF_FUNDED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }

  const pathwayLabel =
    studentProfile.programmeChoice === 'EXAM_ONLY' ||
    studentProfile.enrollmentType === 'EXAM_ONLY'
      ? 'Exam-Only Pathway'
      : 'Modular Pathway'

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
          <ClipboardList className="h-4 w-4" /> Exam History
        </h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {pathwayLabel}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${fundingColors[studentProfile.fundingSource] || fundingColors.SELF_FUNDED}`}>
            {studentProfile.fundingSource.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{passed}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Passed</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-xl font-black text-red-500 dark:text-red-400">{failed}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Failed</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-xl font-black text-blue-500 dark:text-blue-400">{booked}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Booked</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-xl font-black text-slate-400 dark:text-slate-500">{pending}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Pending</p>
        </div>
      </div>

      {/* Exam List */}
      {examBookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/30">
          <ClipboardList className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-500">No exam records yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Exam bookings will appear here as the student registers for exams.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800/40">
                <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Module</th>
                <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Date</th>
                <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Category</th>
                <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Result</th>
                <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Score</th>
                <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Attempt</th>
              </tr>
            </thead>
            <tbody>
              {examBookings.map((booking) => {
                const resultLower = booking.result?.toLowerCase()
                const isPending = !booking.result || booking.status === 'PENDING'
                return (
                  <tr key={booking.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800">
                    <td className="px-4 py-2 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {booking.moduleCode || '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
                      {booking.examDate
                        ? new Date(booking.examDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : <span className="italic text-slate-300">TBD</span>}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        booking.examCategory === 'OFFICIAL_EASA'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                      }`}>
                        {booking.examCategory === 'OFFICIAL_EASA' ? 'EASA' : 'Internal'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {isPending ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">PENDING</span>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          resultLower === 'pass'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : resultLower === 'fail'
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              : ['booked', 'scheduled', 'attended'].includes(resultLower || '')
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {booking.result!.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {booking.percentage != null ? `${booking.percentage}%` : '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {booking.attemptType === 'MIGRATED' ? '—' : (booking.attemptType?.replace('_', ' ') || '—')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <AddExamRecordDialog
          studentId={studentId}
          studentName={studentName}
          examComponents={examComponents}
          onSuccess={() => router.refresh()}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function AcademicHistorySection({ studentId, studentName, examComponents, enrollments, examBookings, studentProfile }: Props) {
  const router = useRouter()
  const [expandedSemester, setExpandedSemester] = useState<string | null>(null)

  if (!studentProfile) return null

  // Exam-only / Modular students: show flat exam history, no semester grouping
  if (isExamPathway(studentProfile)) {
    return (
      <ExamOnlyHistory 
        examBookings={examBookings} 
        studentProfile={studentProfile} 
        studentId={studentId}
        studentName={studentName}
        examComponents={examComponents}
      />
    )
  }

  // Full-time / Short-course: semester-grouped academic history
  const semesters = groupBySemester(enrollments, examBookings)

  // Count unmatched exam bookings (not linked to any enrollment)
  const matchedModules = new Set(semesters.flatMap((s) => s.enrollments.map((e) => e.course.code)))
  const unmatchedExams = examBookings.filter((b) => b.moduleCode && !matchedModules.has(b.moduleCode))

  const _totalCourses = enrollments.length
  const totalExamsWithResults = examBookings.filter((b) => b.result?.toLowerCase() === 'pass' || b.result?.toLowerCase() === 'fail').length
  const upcomingExamsCount = examBookings.filter((b) => !b.result || !['pass', 'fail', 'absent'].includes(b.result.toLowerCase())).length
  const passedExams = examBookings.filter((b) => b.result?.toLowerCase() === 'pass').length

  const fundingColors: Record<string, string> = {
    SCHOLARSHIP: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    SPONSORED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    SELF_FUNDED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    ENROLLED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    DEFERRED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    WITHDRAWN: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    GRADUATED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  }

  const completenessIcon = {
    complete: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    partial: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    empty: <XCircle className="h-4 w-4 text-red-400" />,
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
          <BookOpen className="h-4 w-4" /> Academic History
        </h2>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${fundingColors[studentProfile.fundingSource] || fundingColors.SELF_FUNDED}`}>
            {studentProfile.fundingSource.replace('_', ' ')}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusColors[studentProfile.enrollmentStatus] || statusColors.ENROLLED}`}>
            {studentProfile.enrollmentStatus}
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-2xl font-black text-aerojet-blue dark:text-white">{semesters.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Semesters</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{passedExams}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Passed</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-2xl font-black text-blue-500 dark:text-blue-400">{upcomingExamsCount}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Upcoming</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-2xl font-black text-slate-400 dark:text-slate-500">{totalExamsWithResults}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Results</p>
        </div>
      </div>

      {/* Completeness Grid */}
      {semesters.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {semesters.map((sem) => {
            const status = getCompletenessStatus(sem)
            const bgClass = status === 'complete'
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
              : status === 'partial'
                ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'

            return (
              <button
                key={sem.key}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 ${bgClass}`}
                onClick={() => setExpandedSemester(expandedSemester === sem.key ? null : sem.key)}
              >
                {completenessIcon[status]}
                <span className="text-slate-700 dark:text-slate-300">{sem.semesterName}</span>
                <span className="text-slate-400">({sem.enrollments.length})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Semester Sections */}
      {semesters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/30">
          <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-500">No semester enrollments found</p>
          <p className="mt-1 text-xs text-slate-400">
            Import academic records via{' '}
            <Link href="/staff/students/import" className="text-blue-500 hover:underline">Student Import</Link>
            {' '}or use{' '}
            <Link href="/staff/enrollments/batch" className="text-blue-500 hover:underline">Batch Enrollment</Link>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {semesters.map((sem) => {
            const isExpanded = expandedSemester === sem.key
            const status = getCompletenessStatus(sem)

            return (
              <div key={sem.key} className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <button
                  className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/60"
                  onClick={() => setExpandedSemester(isExpanded ? null : sem.key)}
                >
                  <div className="flex items-center gap-3">
                    {completenessIcon[status]}
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {sem.semesterName}
                    </span>
                    <span className="text-xs text-slate-400">({sem.yearName})</span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {sem.enrollments.length} courses
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-white text-left dark:border-slate-700 dark:bg-slate-900/30">
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Code</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Course</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Enrollment</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Exam Result</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Score</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Attempt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.enrollments.map((enrollment) => {
                          const exams = sem.examResults.get(enrollment.course.code) || []
                          const latestExam = exams.length > 0 ? exams[exams.length - 1] : null

                          return (
                            <tr key={enrollment.id} className="border-b border-slate-50 dark:border-slate-800">
                              <td className="px-4 py-2 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                                {enrollment.course.code}
                              </td>
                              <td className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300">
                                {enrollment.course.name}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  enrollment.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : enrollment.status === 'ACTIVE'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {enrollment.status}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                {latestExam ? (
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    latestExam.result?.toLowerCase() === 'pass'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                      : latestExam.result?.toLowerCase() === 'fail'
                                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                        : ['booked', 'scheduled', 'attended'].includes(latestExam.result?.toLowerCase() || '')
                                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                  }`}>
                                    {latestExam.result?.toUpperCase() || 'PENDING'}
                                  </span>
                                ) : (
                                  <span className="text-xs italic text-slate-400">No exam record</span>
                                )}
                              </td>
                              <td className="px-4 py-2 font-mono text-xs text-slate-600 dark:text-slate-300">
                                {latestExam?.percentage != null ? `${latestExam.percentage}%` : '—'}
                              </td>
                              <td className="px-4 py-2 text-xs text-slate-500">
                                {latestExam?.attemptType?.replace('_', ' ') || '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Standalone Exams */}
      {unmatchedExams.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
            <BookOpen className="h-4 w-4" /> Standalone Exams
          </h3>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              The following exams were taken independently or transferred, and are not linked to a specific semester enrollment.
            </p>
            <div className="flex flex-wrap gap-2">
              {unmatchedExams.map((exam) => {
                const isPass = exam.result?.toLowerCase() === 'pass'
                const isFail = exam.result?.toLowerCase() === 'fail'
                const statusColor = isPass
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : isFail
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400'
                  : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'

                return (
                  <span
                    key={exam.id}
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor}`}
                  >
                    <span className="font-mono">{exam.moduleCode}</span>
                    <span className="mx-1.5 opacity-50">•</span>
                    <span className="uppercase">{exam.result || 'Pending'}</span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <AddExamRecordDialog
          studentId={studentId}
          studentName={studentName}
          examComponents={examComponents}
          onSuccess={() => router.refresh()}
        />
        <Link
          href="/staff/enrollments/batch"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
        >
          <BookOpen className="h-3 w-3" /> Batch Enroll
        </Link>
      </div>
    </div>
  )
}
