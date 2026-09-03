'use client'

import { useState } from 'react'
import {
  BookOpen,
  Calendar,
  Award,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface Grade {
  id: string
  assessmentName: string
  assessmentType: string
  score: number | string
  maxScore: number | string
  percentage: number | string
  grade?: string | null
  assessmentDate: string | Date
}

interface Enrollment {
  id: string
  status: string
  enrolledAt?: string | null
  approvedAt?: string | null
  completedAt?: string | null
  course?: { name: string; code: string } | null
  grades?: Grade[]
}

interface AttendanceRecord {
  id: string
  date: string | Date
  status: string
  minutesLate?: number | null
  class?: { name?: string; course?: { name?: string } } | null
}

interface OjtPeriod {
  id: string
  companyName: string
  companyAddress?: string | null
  supervisorName?: string | null
  status: string
  hoursCompleted: number
  hoursRequired: number
  startDate?: string | null
  endDate?: string | null
}

interface FullTimeEnrollment {
  id: string
  currentYearNumber?: number | null
  status: string
  programme?: { name: string } | null
  ojtPeriods?: OjtPeriod[]
}

interface Props {
  student: any
  onRefresh: () => void
}

export default function AcademicTab({ student, onRefresh }: Props) {
  const [expandedEnrollment, setExpandedEnrollment] = useState<string | null>(null)
  const [expandedOjt, setExpandedOjt] = useState<string | null>(null)

  const enrollments: Enrollment[] = student.enrollments || []
  const attendanceRecords: AttendanceRecord[] = student.attendanceRecords || []
  const fullTimeEnrollments: FullTimeEnrollment[] = student.fullTimeEnrollments || []

  // Calculate attendance stats
  const attendanceStats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter((r: any) => r.status === 'PRESENT').length,
    absent: attendanceRecords.filter((r: any) => r.status === 'ABSENT').length,
    late: attendanceRecords.filter((r: any) => r.status === 'LATE').length,
  }

  return (
    <div className="space-y-8">
      {/* Enrollments */}
      <Section title="Course Enrollments" icon={BookOpen}>
        {enrollments.length === 0 ? (
          <EmptyState message="No course enrollments" />
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment: Enrollment) => {
              const isExpanded = expandedEnrollment === enrollment.id
              const grades = enrollment.grades || []
              const avgGrade =
                grades.length > 0
                  ? grades.reduce((sum: number, g: Grade) => sum + Number(g.percentage || 0), 0) /
                    grades.length
                  : null

              return (
                <div
                  key={enrollment.id}
                  className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                >
                  <button
                    onClick={() => setExpandedEnrollment(isExpanded ? null : enrollment.id)}
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {enrollment.course?.name || 'Unknown Course'}
                        </p>
                        <p className="font-mono text-xs text-slate-400">
                          {enrollment.course?.code || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          enrollment.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : enrollment.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-700'
                              : enrollment.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {enrollment.status}
                      </span>
                      {avgGrade !== null && (
                        <span className="font-mono text-sm font-bold text-slate-600">
                          {avgGrade.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 px-4 pt-2 pb-4 dark:border-slate-700">
                      <div className="mb-3 flex items-center gap-4 text-xs text-slate-400">
                        <span>
                          Enrolled:{' '}
                          {enrollment.enrolledAt
                            ? new Date(enrollment.enrolledAt).toLocaleDateString('en-GB')
                            : '—'}
                        </span>
                        {enrollment.approvedAt && (
                          <span>
                            Approved: {new Date(enrollment.approvedAt).toLocaleDateString('en-GB')}
                          </span>
                        )}
                        {enrollment.completedAt && (
                          <span>
                            Completed:{' '}
                            {new Date(enrollment.completedAt).toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </div>

                      {/* Grades */}
                      {grades.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            Grades ({grades.length})
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-700">
                                  <th className="pb-2 text-left font-black">Assessment</th>
                                  <th className="pb-2 text-center font-black">Score</th>
                                  <th className="pb-2 text-center font-black">%</th>
                                  <th className="pb-2 text-center font-black">Grade</th>
                                  <th className="pb-2 text-right font-black">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {grades.map((grade: Grade) => (
                                  <tr key={grade.id}>
                                    <td className="py-2">
                                      <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {grade.assessmentName}
                                      </span>
                                      <span className="ml-1 text-slate-400">
                                        ({grade.assessmentType})
                                      </span>
                                    </td>
                                    <td className="py-2 text-center font-mono">
                                      {Number(grade.score)}/{Number(grade.maxScore)}
                                    </td>
                                    <td className="py-2 text-center font-mono">
                                      {Number(grade.percentage).toFixed(1)}%
                                    </td>
                                    <td className="py-2 text-center">
                                      <span
                                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                          Number(grade.percentage) >= 75
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}
                                      >
                                        {grade.grade ||
                                          (Number(grade.percentage) >= 75 ? 'PASS' : 'FAIL')}
                                      </span>
                                    </td>
                                    <td className="py-2 text-right text-slate-400">
                                      {new Date(grade.assessmentDate).toLocaleDateString('en-GB')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No grades recorded yet</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Attendance */}
      <Section title="Attendance" icon={Calendar}>
        <div className="mb-4 grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-lg font-black text-slate-700 dark:text-slate-200">
              {attendanceStats.total}
            </p>
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Total</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center dark:border-emerald-900/30 dark:bg-emerald-900/10">
            <p className="text-lg font-black text-emerald-600">{attendanceStats.present}</p>
            <p className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">
              Present
            </p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center dark:border-red-900/30 dark:bg-red-900/10">
            <p className="text-lg font-black text-red-600">{attendanceStats.absent}</p>
            <p className="text-[10px] font-black tracking-widest text-red-600 uppercase">Absent</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center dark:border-amber-900/30 dark:bg-amber-900/10">
            <p className="text-lg font-black text-amber-600">{attendanceStats.late}</p>
            <p className="text-[10px] font-black tracking-widest text-amber-600 uppercase">Late</p>
          </div>
        </div>

        {attendanceRecords.length === 0 ? (
          <EmptyState message="No attendance records" />
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-2 text-left font-black text-slate-400">Date</th>
                  <th className="px-4 py-2 text-left font-black text-slate-400">Course</th>
                  <th className="px-4 py-2 text-center font-black text-slate-400">Status</th>
                  <th className="px-4 py-2 text-right font-black text-slate-400">Minutes Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {attendanceRecords.slice(0, 20).map((record: AttendanceRecord) => (
                  <tr key={record.id}>
                    <td className="px-4 py-2 text-slate-500">
                      {new Date(record.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                      {record.class?.course?.name || record.class?.name || '—'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {record.status === 'PRESENT' ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                      ) : record.status === 'ABSENT' ? (
                        <XCircle className="mx-auto h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="mx-auto h-4 w-4 text-amber-500" />
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-slate-500">
                      {record.minutesLate || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* OJT (for full-time students) */}
      {fullTimeEnrollments.length > 0 && (
        <Section title="On-The-Job Training (OJT)" icon={User}>
          <div className="space-y-3">
            {fullTimeEnrollments.map((fte: FullTimeEnrollment) => (
              <div
                key={fte.id}
                className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {fte.programme?.name || 'Full-Time Programme'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Year {fte.currentYearNumber} • {fte.status}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedOjt(expandedOjt === fte.id ? null : fte.id)}
                    className="text-aerojet-blue flex items-center gap-1 text-xs font-bold"
                  >
                    {expandedOjt === fte.id ? 'Hide' : 'View'} OJT Periods
                  </button>
                </div>

                {expandedOjt === fte.id && fte.ojtPeriods?.length > 0 && (
                  <div className="space-y-3 p-4">
                    {fte.ojtPeriods.map((ojt: OjtPeriod) => (
                      <div
                        key={ojt.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-200">
                              {ojt.companyName}
                            </p>
                            <p className="text-xs text-slate-400">
                              {ojt.companyAddress || 'No address'} • Supervisor:{' '}
                              {ojt.supervisorName || '—'}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                              ojt.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : ojt.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {ojt.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                          <span>
                            {ojt.startDate
                              ? new Date(ojt.startDate).toLocaleDateString('en-GB')
                              : '—'}
                            {ojt.endDate
                              ? ` - ${new Date(ojt.endDate).toLocaleDateString('en-GB')}`
                              : ' - Present'}
                          </span>
                          <span>
                            Hours: {ojt.hoursCompleted}/{ojt.hoursRequired}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {expandedOjt === fte.id && (!fte.ojtPeriods || fte.ojtPeriods.length === 0) && (
                  <div className="p-4 text-center text-sm text-slate-400">
                    No OJT periods recorded
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-sm font-bold text-slate-400">{message}</p>
    </div>
  )
}
