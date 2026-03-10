import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import TrackedCourseLink from '@/components/shared/TrackedCourseLink'
import TrackedImpression from '@/components/shared/TrackedImpression'
import { BookOpen, Clock, GraduationCap, CheckCircle2 } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import EnrollButton from './_components/EnrollButton'

export const metadata: Metadata = {
  title: 'Enroll in Course | Student Portal',
  description: 'Browse and enroll in available aviation training courses.',
}

import { CourseCategoryFilter } from '@/components/CourseCategoryFilter'

const categoryLabel: Record<string, string> = {
  FOUR_YEAR: '4-Year Programme',
  TWO_YEAR: '2-Year Programme',
  MILITARY: 'Military / Industry',
  MODULAR: 'Modular',
  EXAM_ONLY: 'Exam Only',
  REVISION: 'Revision Support',
}

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const session = await getAuthSession()
  if (!session) redirect('/login')

  // 1. Fetch user profile and existing enrollments
  const [studentProfile, userEnrollments] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { pathwayId: true, pathwayRel: { select: { code: true } } },
    }),
    prisma.enrollment.findMany({
      where: { userId: session.user.id },
      select: { courseId: true, status: true },
    }),
  ])

  const enrolledCourseIds = new Set(userEnrollments.map((e) => e.courseId))

  // 2. Fetch all unique course categories
  const allCategories = await prisma.courseCategory.findMany({
    orderBy: { name: 'asc' },
  })
  const categories = allCategories.map((c) => ({ id: c.id, name: c.name }))

  // 3. Fetch courses with filter (including category relation)
  let allCourses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(category ? { category: { name: category } } : {}),
    },
    include: { category: true },
    orderBy: [{ category: { name: 'asc' } }, { code: 'asc' }],
  })

  // Group by category name
  const grouped = allCourses.reduce(
    (acc, c) => {
      const cat = c.category?.name || 'GENERAL'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(c)
      return acc
    },
    {} as Record<string, typeof allCourses>
  )

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <Link
            href="/student/courses"
            className="group inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#4c9ded] uppercase transition-colors hover:text-[#002a5c] dark:hover:text-blue-400"
          >
            ← Back to Campus
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] uppercase sm:text-4xl dark:text-white">
            Enrollment
          </h1>
          <p className="max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400">
            Enhance your aviation career by enrolling in additional specialized modules and licensed
            training programmes.
          </p>
        </div>

        <div className="shrink-0">
          <CourseCategoryFilter categories={categories} currentCategory={category} />
        </div>
      </div>

      <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

      {allCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <BookOpen className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
            No Modules Available
          </h3>
          <p className="text-sm font-medium text-slate-500">
            Check back later for new course offerings.
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-8">
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-black tracking-[0.3em] text-blue-500 uppercase dark:text-[#4c9ded]">
                  {categoryLabel[cat] || cat.replace(/_/g, ' ')}
                </h2>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800/50" />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course.id)

                  return (
                    <div
                      key={course.id}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#4c9ded]/30 hover:shadow-xl hover:shadow-[#002a5c]/5 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <TrackedImpression courseId={course.id} />
                      <div className="flex flex-1 flex-col p-7">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-xs font-black tracking-widest text-[#4c9ded] uppercase dark:bg-slate-800">
                            {course.code}
                          </span>
                          {isEnrolled && (
                            <span className="flex items-center gap-1 text-xs font-black tracking-widest text-emerald-600 uppercase">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Active
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl leading-tight font-black text-[#002a5c] transition-colors group-hover:text-[#4c9ded] dark:text-white dark:group-hover:text-blue-400">
                          {course.name}
                        </h3>

                        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                          {course.description || 'Professional aviation training module.'}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-4 text-[11px] font-bold text-slate-400">
                          {course.duration && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-[#4c9ded]" />
                              <span>{course.duration.toLocaleString()} Hrs</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5 text-[#4c9ded]" />
                            <span>EASA Part-66</span>
                          </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-50 pt-6 dark:border-slate-800/50">
                          <div>
                            <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                              Investment
                            </p>
                            <p className="text-2xl font-black text-[#002a5c] dark:text-white">
                              {course.currency} {Number(course.price).toLocaleString()}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {isEnrolled ? (
                              <TrackedCourseLink
                                courseId={course.id}
                                href={`/student/courses/${course.id}`}
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 px-6 text-xs font-black tracking-widest text-emerald-600 uppercase transition-all hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                              >
                                View
                              </TrackedCourseLink>
                            ) : (
                              <EnrollButton
                                courseId={course.id}
                                price={Number(course.price)}
                                currency={course.currency}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
