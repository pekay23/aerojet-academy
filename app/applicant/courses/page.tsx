import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Clock, Users, Globe, BookOpen, CheckCircle2, Lock } from 'lucide-react'
import { Suspense } from 'react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Browse Courses | Applicant Portal' }
export const dynamic = 'force-dynamic'

const categoryLabel: Record<string, string> = {
  FOUR_YEAR: '4-Year Programme',
  TWO_YEAR: '2-Year Programme',
  MILITARY: 'Military / Industry',
  MODULAR: 'Modular',
  EXAM_ONLY: 'Exam Only',
  REVISION: 'Revision Support',
}

const categoryColor: Record<string, string> = {
  FOUR_YEAR: 'bg-blue-50 text-blue-700 border-blue-200',
  TWO_YEAR: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MILITARY: 'bg-orange-50 text-orange-700 border-orange-200',
  MODULAR: 'bg-purple-50 text-purple-700 border-purple-200',
  EXAM_ONLY: 'bg-teal-50 text-teal-700 border-teal-200',
  REVISION: 'bg-slate-50 text-slate-700 border-slate-200',
}

export default async function CoursesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const canEnroll = session.user.status === 'ACTIVE'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Available Courses
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Explore EASA Part-66 licensed programmes offered by Aerojet Aviation Training Academy.
        </p>
      </div>

      {!canEnroll && (
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
          <div>
            <p className="text-sm font-bold text-orange-800">Enrollment Not Yet Available</p>
            <p className="mt-0.5 text-xs text-orange-600">
              Your registration must be approved before you can enroll in a course. Complete your
              registration payment first.
            </p>
          </div>
        </div>
      )}

      <Suspense fallback={<CoursesSkeleton />}>
        <CourseList canEnroll={canEnroll} />
      </Suspense>
    </div>
  )
}

function CoursesSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  )
}

async function CourseList({ canEnroll }: { canEnroll: boolean }) {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { code: 'asc' }],
  })

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-300 shadow-sm">
          <BookOpen className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No courses available</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          There are currently no active courses available for enrollment. Please check back later.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <div
          key={course.id}
          className="flex flex-col gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 font-mono text-xs font-bold text-slate-400">{course.code}</p>
              <h2 className="text-base font-bold leading-snug text-slate-900 dark:text-slate-100">{course.name}</h2>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${categoryColor[course.category] ?? 'border-slate-200 bg-slate-50 text-slate-500'}`}
            >
              {categoryLabel[course.category] ?? course.category}
            </span>
          </div>

          {/* Description */}
          {course.description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {course.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            {course.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {course.duration.toLocaleString()} hrs
              </span>
            )}
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              EASA Part-66
            </span>
          </div>

          {/* Price + CTA */}
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-50 pt-4">
            <div>
              <p className="text-xs text-slate-400">Tuition Fee</p>
              <p className="text-lg font-black text-[#002a5c]">
                {course.currency} {Number(course.price).toLocaleString()}
              </p>
            </div>
            {canEnroll ? (
              <a
                href={`/applicant/courses/${course.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#002a5c] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#003875]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Enroll
              </a>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-400">
                <Lock className="h-3.5 w-3.5" />
                Locked
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

