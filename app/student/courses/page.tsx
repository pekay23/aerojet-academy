import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, GraduationCap, Clock, ChevronRight, AlertCircle, PlayCircle } from 'lucide-react'
import { Suspense } from 'react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'My Courses | Student Portal' }

export default async function CoursesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            My Courses
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your active and upcoming courses.</p>
        </div>
        <Link
          href="/student/courses/enroll"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95"
        >
          <BookOpen className="h-4 w-4" />
          Enroll in New Course
        </Link>
      </div>

      <Suspense fallback={<CoursesSkeleton />}>
        <CourseList userId={session.user.id} />
      </Suspense>
    </div>
  )
}

function CoursesSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  )
}

async function CourseList({ userId }: { userId: string }) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: true,
    },
    orderBy: { enrolledAt: 'desc' },
  })

  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-300 shadow-sm">
          <BookOpen className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Not enrolled in any courses</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          You haven&apos;t enrolled in any courses yet. Browse our available courses to get started
          with your training.
        </p>
        <div className="mt-8">
          <Link
            href="/student/courses/enroll"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
          >
            Browse Course Catalog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {enrollments.map((enrollment) => (
        <Link
          key={enrollment.id}
          href={`/student/courses/${enrollment.id}`}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 transition-colors group-hover:bg-blue-50/50">
            <div className="mb-4 flex items-center justify-between">
              <span
                className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                  enrollment.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : enrollment.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-700'
                }`}
              >
                {enrollment.status}
              </span>
              <BookOpen className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
            </div>
            <h3 className="line-clamp-2 font-black text-slate-900 dark:text-slate-100">{enrollment.course.name}</h3>
            <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{enrollment.course.code}</p>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-6">
            <div className="mb-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{enrollment.course.duration || 'Flexible'} hrs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>{enrollment.course.category}</span>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 group-hover:underline">
                View Details
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

