import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Users, ClipboardCheck, BookOpen, BarChart3, Calendar } from 'lucide-react'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Prisma } from '@prisma/client'

type GradeRow = Prisma.GradeGetPayload<{
  include: { user: { include: { profile: true } } }
}>
type AttendanceRow = Prisma.AttendanceRecordGetPayload<{
  include: { user: { include: { profile: true } } }
}>
type ResourceRow = Prisma.GeneralResourceGetPayload<Record<string, never>>

export const metadata: Metadata = { title: 'Class Detail | Instructor Portal' }

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab || 'roster'

  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return await redirectToLogin()

  function slugify(text: string) {
    return (
      text
        ?.toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-') || ''
    )
  }

  const allClasses = await prismaUnfiltered.class.findMany({ select: { id: true, name: true } })
  const matchedClass = allClasses.find((c) => slugify(c.name) === id)
  const targetId = matchedClass ? matchedClass.id : id

  const classData = await prismaUnfiltered.class.findUnique({
    where: { id: targetId },
    include: {
      course: {
        include: {
          enrollments: {
            where: { status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED'] } },
            include: {
              user: { include: { profile: true } },
            },
          },
        },
      },
    },
  })

  if (!classData) notFound()

  const { course } = classData
  const enrollments = course.enrollments || []

  // Only fetch tab-specific data for the active tab
  let grades: GradeRow[] = []
  let attendanceRecords: AttendanceRow[] = []
  let resources: ResourceRow[] = []
  let attendanceStats = { rate: 0, present: 0, late: 0, absent: 0, total: 0 }

  if (activeTab === 'grades') {
    grades = await prismaUnfiltered.grade.findMany({
      where: { enrollment: { courseId: course.id } },
      include: { user: { include: { profile: true } } },
      orderBy: { assessmentDate: 'desc' },
    })
  }

  if (activeTab === 'attendance') {
    attendanceRecords = await prismaUnfiltered.attendanceRecord.findMany({
      where: { classId: id },
      include: { user: { include: { profile: true } } },
      orderBy: { date: 'desc' },
      take: 50,
    })
    const present = attendanceRecords.filter((r) => r.status === 'PRESENT').length
    const late = attendanceRecords.filter((r) => r.status === 'LATE').length
    const absent = attendanceRecords.filter((r) => r.status === 'ABSENT').length
    const total = attendanceRecords.length
    attendanceStats = {
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
      present,
      late,
      absent,
      total,
    }
  }

  if (activeTab === 'materials') {
    resources = await prismaUnfiltered.generalResource.findMany({
      where: { showToInstructors: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })
  }

  const tabs = [
    { key: 'roster', label: 'Roster', icon: Users, count: enrollments.length },
    { key: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { key: 'grades', label: 'Grades', icon: BarChart3 },
    { key: 'materials', label: 'Materials', icon: BookOpen },
  ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
      {/* Header */}
      <div>
        <Link
          href="/instructor/classes"
          className="hover:text-aerojet-sky mb-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors dark:text-slate-500"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to My Classes
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-aerojet-sky text-xs font-black tracking-widest uppercase">
                {course.code}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs font-bold text-slate-400">{classData.name}</span>
            </div>
            <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
              {course.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/50">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-bold text-slate-600 dark:text-slate-300">
                {classData.currentStudents}/{classData.maxStudents}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/50">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-bold text-slate-600 dark:text-slate-300">
                {format(new Date(classData.startDate), 'MMM d')} –{' '}
                {format(new Date(classData.endDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-2xl border border-slate-100 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.key
          return (
            <Link
              key={t.key}
              href={`/instructor/classes/${id}?tab=${t.key}`}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide uppercase transition-all',
                isActive
                  ? 'bg-aerojet-sky text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.count !== undefined && (
                <span
                  className={cn(
                    'rounded-lg px-1.5 py-0.5 text-xs font-black',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                  )}
                >
                  {t.count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* ─── ROSTER TAB ─── */}
        {activeTab === 'roster' && (
          <>
            <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/20">
              <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                Enrolled Students ({enrollments.length})
              </h2>
              <Link
                href={`/instructor/attendance/${id}`}
                className="bg-aerojet-sky hover:bg-aerojet-blue inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest text-white uppercase transition-all"
              >
                <ClipboardCheck className="h-3 w-3" />
                Take Attendance
              </Link>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800">
                        {enrollment.user.profile?.firstName?.[0]}
                        {enrollment.user.profile?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {enrollment.user.profile?.firstName} {enrollment.user.profile?.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{enrollment.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase',
                          enrollment.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10'
                        )}
                      >
                        {enrollment.status}
                      </span>
                      <Link
                        href={`/instructor/students/${enrollment.userId}`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                        title="View Student"
                      >
                        <Users className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <Users className="mx-auto mb-4 h-12 w-12 opacity-10" />
                  <p className="text-sm font-medium">No students enrolled yet.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── ATTENDANCE TAB ─── */}
        {activeTab === 'attendance' && (
          <>
            <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/20">
              <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                Attendance Summary
              </h2>
              <Link
                href={`/instructor/attendance/${id}`}
                className="bg-aerojet-sky hover:bg-aerojet-blue inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest text-white uppercase transition-all"
              >
                <ClipboardCheck className="h-3 w-3" />
                Mark Attendance
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 border-b border-slate-50 p-6 sm:grid-cols-4 dark:border-slate-800">
              {[
                {
                  label: 'Attendance Rate',
                  value: `${attendanceStats.rate}%`,
                  color: 'text-blue-600',
                },
                { label: 'Present', value: attendanceStats.present, color: 'text-emerald-600' },
                { label: 'Late', value: attendanceStats.late, color: 'text-orange-600' },
                { label: 'Absent', value: attendanceStats.absent, color: 'text-red-600' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    {stat.label}
                  </p>
                  <p className={cn('mt-1 text-2xl font-black', stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase dark:bg-slate-800">
                        {record.user.profile?.firstName?.[0]}
                        {record.user.profile?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {record.user.profile?.firstName} {record.user.profile?.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-[10px] font-black uppercase',
                        record.status === 'PRESENT' &&
                          'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10',
                        record.status === 'ABSENT' && 'bg-red-50 text-red-600 dark:bg-red-500/10',
                        record.status === 'LATE' &&
                          'bg-orange-50 text-orange-600 dark:bg-orange-500/10',
                        record.status === 'EXCUSED' &&
                          'bg-blue-50 text-blue-600 dark:bg-blue-500/10'
                      )}
                    >
                      {record.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <ClipboardCheck className="mx-auto mb-4 h-12 w-12 opacity-10" />
                  <p className="text-sm font-medium">No attendance records yet.</p>
                  <Link
                    href={`/instructor/attendance/${id}`}
                    className="text-aerojet-sky mt-3 inline-flex text-xs font-bold hover:underline"
                  >
                    Start taking attendance
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── GRADES TAB ─── */}
        {activeTab === 'grades' && (
          <>
            <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/20">
              <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                Grades ({grades.length})
              </h2>
              <Link
                href="/instructor/grading"
                className="bg-aerojet-sky hover:bg-aerojet-blue inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest text-white uppercase transition-all"
              >
                <BarChart3 className="h-3 w-3" />
                Grading Hub
              </Link>
            </div>
            {grades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-175">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-800/30">
                      <th className="px-6 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Assessment
                      </th>
                      <th className="px-6 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Score
                      </th>
                      <th className="px-6 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        %
                      </th>
                      <th className="px-6 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {grades.map((grade) => {
                      const pct = Number(grade.percentage) || 0
                      const passing = pct >= 75
                      return (
                        <tr
                          key={grade.id}
                          className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-500 uppercase dark:bg-slate-800">
                                {grade.user.profile?.firstName?.[0]}
                                {grade.user.profile?.lastName?.[0]}
                              </div>
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {grade.user.profile?.firstName} {grade.user.profile?.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {grade.assessmentName}
                          </td>
                          <td className="px-6 py-3">
                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase dark:bg-slate-800">
                              {grade.assessmentType}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-bold text-slate-700 tabular-nums dark:text-slate-300">
                            {Number(grade.score)}/{Number(grade.maxScore)}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span
                              className={cn(
                                'text-sm font-black tabular-nums',
                                passing ? 'text-emerald-600' : 'text-red-600'
                              )}
                            >
                              {pct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span
                              className={cn(
                                'inline-flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black',
                                passing
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                                  : 'bg-red-50 text-red-600 dark:bg-red-500/10'
                              )}
                            >
                              {grade.grade}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-10" />
                <p className="text-sm font-medium">No grades recorded for this class yet.</p>
              </div>
            )}
          </>
        )}

        {/* ─── MATERIALS TAB ─── */}
        {activeTab === 'materials' && (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            <div className="border-b border-slate-50 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/20">
              <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                Course Materials
              </h2>
            </div>
            <div className="px-6 py-5">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-slate-500 uppercase">
                <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                Syllabus
              </h3>
              {course.syllabusUrl ? (
                <a
                  href={course.syllabusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
                >
                  <BookOpen className="h-4 w-4" />
                  Download Syllabus ({course.code})
                </a>
              ) : (
                <p className="text-xs text-slate-400 italic">No syllabus uploaded yet.</p>
              )}
            </div>
            <div className="px-6 py-5">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-slate-500 uppercase">
                <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                Learning Materials
              </h3>
              {course.materialsUrl ? (
                <a
                  href={course.materialsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
                >
                  <BookOpen className="h-4 w-4" />
                  Access Course Materials
                </a>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No additional materials uploaded yet.
                </p>
              )}
            </div>
            {resources.length > 0 && (
              <div className="px-6 py-5">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-slate-500 uppercase">
                  <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                  General Resources ({resources.length})
                </h3>
                <div className="space-y-2">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {resource.name}
                        </p>
                        {resource.description && (
                          <p className="mt-0.5 text-xs text-slate-400">{resource.description}</p>
                        )}
                      </div>
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300"
                        >
                          Open
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
