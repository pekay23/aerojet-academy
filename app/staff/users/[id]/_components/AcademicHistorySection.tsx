'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, BookOpen, FileText } from 'lucide-react'

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface EnrollmentData {
  id: string
  status: string
  completedAt: string | null
  course: { code: string; name: string }
  academicYear: { name: string } | null
  semester: { name: string } | null
}

interface ExamBookingData {
  id: string
  moduleCode: string | null
  result: string | null
  score: number | null
  percentage: number | null
  attemptType: string | null
  sourceNotes: string | null
  examDate: string | null
  status: string
}

interface StudentProfileData {
  studentId: string
  enrollmentStatus: string
  fundingSource: string
  currentYearNumber: number
  currentSemesterNumber: number
  programmeChoice: string | null
}

interface Props {
  enrollments: EnrollmentData[]
  examBookings: ExamBookingData[]
  studentProfile: StudentProfileData | null
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

interface SemesterGroup {
  key: string
  yearName: string
  semesterName: string
  enrollments: EnrollmentData[]
  examResults: Map<string, ExamBookingData[]> // moduleCode -> bookings
}

function groupBySemester(
  enrollments: EnrollmentData[],
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
    if (exams.some((ex) => ex.result === 'pass' || ex.result === 'fail')) {
      withResults++
    }
  }

  if (withResults === total) return 'complete'
  if (withResults > 0) return 'partial'
  return 'empty'
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export default function AcademicHistorySection({ enrollments, examBookings, studentProfile }: Props) {
  const [expandedSemester, setExpandedSemester] = useState<string | null>(null)

  if (!studentProfile) return null

  const semesters = groupBySemester(enrollments, examBookings)

  // Count unmatched exam bookings (not linked to any enrollment)
  const matchedModules = new Set(semesters.flatMap((s) => s.enrollments.map((e) => e.course.code)))
  const unmatchedExams = examBookings.filter((b) => b.moduleCode && !matchedModules.has(b.moduleCode))

  const totalCourses = enrollments.length
  const totalExamsWithResults = examBookings.filter((b) => b.result === 'pass' || b.result === 'fail').length
  const passedExams = examBookings.filter((b) => b.result === 'pass').length

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
          <p className="text-2xl font-black text-aerojet-blue dark:text-white">{totalCourses}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Courses</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{passedExams}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Exams Passed</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-2xl font-black text-aerojet-blue dark:text-white">{totalExamsWithResults}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Results</p>
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
                                    latestExam.result === 'pass'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                      : latestExam.result === 'fail'
                                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
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

      {/* Unmatched Exam Records */}
      {unmatchedExams.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="mb-2 text-xs font-bold text-amber-700 dark:text-amber-400">
            {unmatchedExams.length} exam record(s) not linked to any course enrollment:
          </p>
          <div className="flex flex-wrap gap-2">
            {unmatchedExams.map((exam) => (
              <span
                key={exam.id}
                className="rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[10px] font-mono font-bold text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              >
                {exam.moduleCode} ({exam.result || 'pending'})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/staff/exams?tab=records"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <FileText className="h-3 w-3" /> Add Exam Record
        </Link>
        <Link
          href="/staff/enrollments/batch"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <BookOpen className="h-3 w-3" /> Batch Enroll
        </Link>
      </div>
    </div>
  )
}
