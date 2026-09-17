import { Metadata } from 'next'
import { getClassAttendance } from '@/lib/actions/instructor'
import { redirect } from 'next/navigation'
import AttendanceRow from './_components/AttendanceRow'
import { format } from 'date-fns'
import { ChevronLeft, Calendar as CalendarIcon, Users } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Attendance Tracker | Instructor Portal' }
export const dynamic = 'force-dynamic'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { id } = await params
  const { date } = await searchParams
  const targetDate = date ? new Date(date) : new Date()

  const data = await getClassAttendance(id, targetDate)
  if (!data) redirect('/instructor/classes')

  const { classData, records } = data
  const enrollments = classData.course.enrollments || []

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/instructor/classes"
            className="hover:text-aerojet-sky mb-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors dark:text-slate-300"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to My Classes
          </Link>
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
            Attendance Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {classData.course.name} ({classData.course.code}) · {classData.name}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CalendarIcon className="text-aerojet-sky h-4 w-4" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {format(targetDate, 'MMMM d, yyyy')}
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/20">
            <h2 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
              <Users className="h-3.5 w-3.5" />
              Student Roster ({enrollments.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {enrollments.length > 0 ? (
              enrollments.map((enrollment) => {
                const record = records.find((r) => r.userId === enrollment.userId)
                return (
                  <AttendanceRow
                    key={enrollment.id}
                    classId={id}
                    userId={enrollment.userId}
                    studentName={`${enrollment.user.profile?.firstName} ${enrollment.user.profile?.lastName}`}
                    initialStatus={record?.status}
                    date={targetDate}
                  />
                )
              })
            ) : (
              <div className="p-12 text-center text-slate-400">
                <p className="text-sm">No active students enrolled in this course.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
