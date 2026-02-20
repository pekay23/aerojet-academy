import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, Clock, GraduationCap, CheckCircle2 } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import EnrollButton from './_components/EnrollButton'

export const metadata: Metadata = { title: 'Enroll in Course | Student Portal' }

export default async function EnrollPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  // 1. Fetch all active courses
  const allCourses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  })

  // 2. Fetch user's existing enrollments
  const userEnrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    select: { courseId: true, status: true },
  })

  const enrolledCourseIds = new Set(userEnrollments.map((e) => e.courseId))

  // 3. Filter out courses user is already associated with (Active, Pending, Suspended)
  // We might want to show them but disabled, but for "Enroll in New" usually we just show new ones.
  // Let's show all but mark enrolled ones.

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/student/courses"
          className="mb-2 inline-block text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-100"
        >
          ← Back to My Courses
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Enroll in New Course
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Browse available courses and expand your aviation skills.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allCourses.map((course) => {
          const isEnrolled = enrolledCourseIds.has(course.id)

          return (
            <div
              key={course.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 transition-colors group-hover:bg-blue-50/50">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-lg bg-white dark:bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 shadow-sm">
                    {course.code}
                  </span>
                  {isEnrolled && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Enrolled
                    </span>
                  )}
                </div>
                <h3 className="line-clamp-2 font-black text-slate-900 dark:text-slate-100">{course.name}</h3>
                <p className="mt-1 text-xs font-bold text-slate-400">{course.category}</p>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <p className="mb-6 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">
                  {course.description || 'No description available.'}
                </p>

                <div className="mb-6 mt-auto flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{course.duration || 'Flex'} hrs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>
                      {course.currency} {Number(course.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-auto">
                  {isEnrolled ? (
                    <button
                      disabled
                      className="w-full cursor-not-allowed rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-400"
                    >
                      Already Enrolled
                    </button>
                  ) : (
                    <EnrollButton courseId={course.id} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
