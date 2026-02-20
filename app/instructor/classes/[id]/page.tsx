import { Metadata } from 'next'
import { getClassAttendance } from '@/lib/actions/instructor'
import { redirect } from 'next/navigation'
import { ChevronLeft, Users, Mail } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Class Roster | Instructor Portal' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getClassAttendance(id)
  if (!data) redirect('/instructor/classes')

  const { classData } = data
  const enrollments = classData.course.enrollments || []

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/instructor/classes"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-[#4c9ded]"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to My Classes
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Class Roster
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {classData.course.name} ({classData.course.code}) · {classData.name}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/20">
          <h2 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
            <Users className="h-3.5 w-3.5" />
            Enrolled Students ({enrollments.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {enrollments.length > 0 ? (
            enrollments.map((enrollment) => (
              <div
                key={enrollment.userId}
                className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50 sm:p-6"
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
                    <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">
                      Student ID: {enrollment.userId.slice(-6).toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-[#4c9ded] dark:hover:bg-blue-900/20"
                    title="Send Email"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400">
              <Users className="mx-auto mb-4 h-12 w-12 opacity-10" />
              <p className="text-sm">No students currently enrolled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
