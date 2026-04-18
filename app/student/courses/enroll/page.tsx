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
      select: { id: true, courseId: true, status: true },
    }),
  ])

  const activeEnrollments = new Map(
    userEnrollments
      .filter((e) => ['ACTIVE', 'APPROVED', 'COMPLETED'].includes(e.status))
      .map((e) => [e.courseId, e.id])
  )
  const pendingEnrollments = new Set(
    userEnrollments
      .filter((e) => ['PENDING', 'DRAFT'].includes(e.status))
      .map((e) => e.courseId)
  )

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
    <div className="relative min-h-screen space-y-12 pb-20">
      {/* Premium Background Elements */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/4 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[100px]" />

      {/* Header Section */}
      <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <Link
            href="/student/courses"
            className="group inline-flex items-center gap-2 text-xs font-bold tracking-widest text-blue-500 uppercase transition-all hover:translate-x-[-4px]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 transition-colors group-hover:bg-blue-100 dark:bg-blue-900/20">
              ←
            </span>
            Back to Campus
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Professional <span className="text-blue-600">Enrollment</span>
            </h1>
            <p className="max-w-xl text-lg font-medium text-slate-500 dark:text-slate-400">
              Elevate your aviation career with specialized EASA Part-66 training modules.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <div className="rounded-2xl border border-slate-100 bg-white/50 p-1.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
            <CourseCategoryFilter categories={categories} currentCategory={category} />
          </div>
        </div>
      </div>

      {allCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-slate-200 bg-slate-50/50 py-32 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-800 dark:shadow-none">
            <BookOpen className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            No Modules Available
          </h3>
          <p className="mt-2 text-slate-500">
            Specialized training modules will appear here shortly.
          </p>
        </div>
      ) : (
        <div className="space-y-20">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <h2 className="text-sm font-black tracking-[0.4em] text-slate-900 uppercase dark:text-white">
                    {categoryLabel[cat] || cat.replace(/_/g, ' ')}
                  </h2>
                </div>
                <div className="h-px flex-1 bg-linear-to-r from-slate-200 to-transparent dark:from-slate-800" />
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((course) => {
                  const enrollmentId = activeEnrollments.get(course.id)
                  const isPending = pendingEnrollments.has(course.id)
                  const isEnrolled = !!enrollmentId

                  return (
                    <div
                      key={course.id}
                      className="group relative flex flex-col overflow-hidden rounded-4xl border border-slate-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <TrackedImpression courseId={course.id} />
                      
                      {/* Decorative Background */}
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-blue-500/5 transition-transform duration-700 group-hover:scale-150" />

                      <div className="relative flex flex-1 flex-col p-8">
                        <div className="mb-6 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="rounded-xl bg-blue-50 px-3 py-1.5 font-mono text-xs font-bold tracking-widest text-blue-600 uppercase dark:bg-blue-900/20">
                              {course.code}
                            </span>
                          </div>
                          {isEnrolled && (
                            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-900/20">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                              </span>
                              <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                                Active
                              </span>
                            </div>
                          )}
                          {isPending && !isEnrolled && (
                            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 dark:bg-amber-900/20">
                              <span className="relative flex h-2 w-2">
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                              </span>
                              <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase">
                                Pending
                              </span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-2xl font-black leading-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {course.name}
                        </h3>

                        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                          {course.description || 'Professional aviation training module designed for excellence.'}
                        </p>

                        <div className="mt-8 flex flex-wrap gap-5">
                          {course.duration && (
                            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 transition-colors group-hover:bg-blue-50/50 dark:bg-slate-800/50">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{course.duration.toLocaleString()} Hrs</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 transition-colors group-hover:bg-blue-50/50 dark:bg-slate-800/50">
                            <GraduationCap className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">EASA Part-66</span>
                          </div>
                        </div>

                        <div className="mt-10 flex items-center justify-between gap-6 border-t border-slate-50 pt-8 dark:border-slate-800/50">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                              Investment
                            </p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-bold text-blue-600">{course.currency}</span>
                              <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                {Number(course.price).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isEnrolled ? (
                              <TrackedCourseLink
                                courseId={course.id}
                                href={`/student/courses/${enrollmentId}`}
                                className="group/btn relative inline-flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-emerald-500 px-8 text-xs font-black tracking-widest text-white uppercase transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                              >
                                <span className="relative z-10 flex items-center gap-2">
                                  Enter <span className="transition-transform group-hover/btn:translate-x-1">→</span>
                                </span>
                              </TrackedCourseLink>
                            ) : isPending ? (
                              <div className="flex h-14 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 px-8 text-xs font-black tracking-widest text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-900/50">
                                Processing...
                              </div>
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
