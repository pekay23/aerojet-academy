import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Clock3,
  CircleDashed,
  GraduationCap,
  Layers3,
  Wallet,
} from 'lucide-react'

import { CourseCategoryFilter } from '@/components/CourseCategoryFilter'
import TrackedCourseLink from '@/components/shared/TrackedCourseLink'
import TrackedImpression from '@/components/shared/TrackedImpression'
import { getAuthSession } from '@/lib/auth/helpers'
import { resolveEffectiveEnrollmentType } from '@/lib/enrollment/pathway'
import prisma from '@/lib/prisma/client'
import EnrollButton from './_components/EnrollButton'

export const metadata: Metadata = {
  title: 'Enroll in Course | Student Portal',
  description: 'Browse and enroll in available aviation training courses.',
}

const categoryLabel: Record<string, string> = {
  FOUR_YEAR: '4-Year Programme',
  TWO_YEAR: '2-Year Programme',
  MILITARY: 'Military / Industry',
  MODULAR: 'Modular',
  EXAM_ONLY: 'Exam Only',
  REVISION: 'Revision Support',
}

const categoryAccent: Record<string, string> = {
  FOUR_YEAR: 'from-blue-600/15 via-blue-500/10 to-transparent',
  TWO_YEAR: 'from-emerald-600/15 via-emerald-500/10 to-transparent',
  MILITARY: 'from-amber-600/15 via-orange-500/10 to-transparent',
  MODULAR: 'from-violet-600/15 via-violet-500/10 to-transparent',
  EXAM_ONLY: 'from-rose-600/15 via-pink-500/10 to-transparent',
  REVISION: 'from-cyan-600/15 via-sky-500/10 to-transparent',
  GENERAL: 'from-slate-600/10 via-slate-500/10 to-transparent',
}

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const studentData = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      studentProfile: {
        select: {
          pathwayId: true,
          enrollmentType: true,
          programmeChoice: true,
          pathwayRel: { select: { code: true } },
          licenseTargets: {
            select: { licenseCategory: { select: { code: true } } },
          },
        },
      },
      enrollments: {
        select: { id: true, courseId: true, status: true },
      },
    },
  })

  const studentProfile = studentData?.studentProfile
  const effectiveEnrollmentType = resolveEffectiveEnrollmentType({
    pathwayCode: studentProfile?.pathwayRel?.code,
    enrollmentType: studentProfile?.enrollmentType,
    programmeChoice: studentProfile?.programmeChoice,
  })

  if (effectiveEnrollmentType === 'EXAM_ONLY') {
    redirect('/student/courses')
  }

  const userEnrollments = studentData?.enrollments || []
  const activeEnrollments = new Map(
    userEnrollments
      .filter((enrollment) => ['ACTIVE', 'APPROVED', 'COMPLETED'].includes(enrollment.status))
      .map((enrollment) => [enrollment.courseId, enrollment.id])
  )
  const pendingEnrollments = new Set(
    userEnrollments
      .filter((enrollment) => ['PENDING', 'DRAFT'].includes(enrollment.status))
      .map((enrollment) => enrollment.courseId)
  )

  const [allCategories, allCourses] = await Promise.all([
    prisma.courseCategory.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.course.findMany({
      where: {
        isActive: true,
        ...(category ? { category: { name: category } } : {}),
      },
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { code: 'asc' }],
    }),
  ])

  // Build set of the student's license target base codes (e.g. 'B1.1' → 'B1')
  const studentLicenseCodes = new Set(
    studentProfile?.licenseTargets?.map(t => {
      const code = t.licenseCategory.code
      // Map specific sub-categories to their base (B1.1 → B1, B1.3 → B1, B2 → B2)
      const dotIdx = code.indexOf('.')
      return dotIdx > 0 ? code.substring(0, dotIdx) : code
    }) ?? []
  )

  // Filter courses based on pathway constraints
  const filteredCourses = allCourses.filter(course => {
    // Rule 1: Modular students cannot see Full-Time specific categories
    if (effectiveEnrollmentType === 'MODULAR') {
      const fullTimeCategories = ['FOUR_YEAR', 'TWO_YEAR', 'MILITARY']
      if (course.category && fullTimeCategories.includes(course.category.name)) {
        return false
      }
    }

    // Rule 2: Filter by applicable license categories if the student has targets
    // and the course has applicableCategories set
    if (studentLicenseCodes.size > 0 && course.applicableCategories.length > 0) {
      const hasOverlap = course.applicableCategories.some(cat => studentLicenseCodes.has(cat))
      if (!hasOverlap) return false
    }

    return true
  })

  // Filter categories that have no visible courses left
  const availableCategoryNames = new Set(filteredCourses.map(c => c.category?.name).filter(Boolean))
  const categories = allCategories
    .filter(cat => availableCategoryNames.has(cat.name))
    .map((courseCategory) => ({
    id: courseCategory.id,
    name: courseCategory.name,
  }))

  const groupedCourses = filteredCourses.reduce(
    (acc, course) => {
      const bucket = course.category?.name || 'GENERAL'
      if (!acc[bucket]) acc[bucket] = []
      acc[bucket].push(course)
      return acc
    },
    {} as Record<string, typeof allCourses>
  )

  return (
    <div className="relative min-h-screen space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-sky-100/60 via-white to-transparent dark:from-slate-900 dark:via-slate-950 dark:to-transparent" />
      <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-52 -left-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-4xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_30%),radial-gradient(circle_at_left,rgba(16,185,129,0.10),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Link
              href="/student/courses"
              className="inline-flex items-center gap-2 text-xs font-black tracking-[0.24em] text-blue-800 uppercase transition-colors hover:text-sky-400 dark:text-blue-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Campus
            </Link>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black tracking-[0.24em] text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                <Layers3 className="h-3.5 w-3.5 text-sky-400" />
                Course Enrollment Desk
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  Build Your Next Module Schedule
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Review live tuition modules, confirm your wallet-backed route, and enroll only in
                  the courses that match your current study pathway.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {allCourses.length} live module{allCourses.length === 1 ? '' : 's'}
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Wallet checkout for paid paths
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm">
            <CourseCategoryFilter categories={categories} currentCategory={category} />
          </div>
        </div>
      </div>

      {allCourses.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center rounded-4xl border border-dashed border-slate-300 bg-white/70 px-6 py-24 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">No Modules Available</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            There are no active modules in this category right now. Try another filter or check back
            shortly.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedCourses).map(([categoryKey, items]) => {
            const accent = categoryAccent[categoryKey] || categoryAccent.GENERAL

            return (
              <section key={categoryKey} className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black tracking-[0.28em] text-white uppercase dark:bg-white dark:text-slate-950">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    {categoryLabel[categoryKey] || categoryKey.replace(/_/g, ' ')}
                  </div>
                  <div className="h-px flex-1 bg-linear-to-r from-slate-300 to-transparent dark:from-slate-700" />
                  <span className="text-[11px] font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                    {items.length} available
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((course) => {
                    const enrollmentId = activeEnrollments.get(course.id)
                    const isPending = pendingEnrollments.has(course.id)
                    const isEnrolled = !!enrollmentId

                    return (
                      <article
                        key={course.id}
                        className="group relative flex min-h-[350px] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_24px_48px_rgba(14,165,233,0.14)] dark:border-slate-800 dark:bg-slate-950/85"
                      >
                        <TrackedImpression courseId={course.id} />
                        <div className={`absolute inset-x-0 top-0 h-24 bg-linear-to-br ${accent}`} />
                        <div className="absolute right-5 top-5">
                          {isEnrolled ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black tracking-[0.18em] text-white uppercase">
                              <BadgeCheck className="h-3.5 w-3.5" />
                              Active
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-black tracking-[0.18em] text-white uppercase">
                              <CircleDashed className="h-3.5 w-3.5" />
                              Pending
                            </span>
                          ) : null}
                        </div>

                        <div className="relative flex flex-1 flex-col p-5 pt-6">
                          <div className="mb-5 flex items-start justify-between gap-3">
                            <div className="space-y-2">
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 font-mono text-[11px] font-black tracking-[0.18em] text-blue-800 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300">
                                {course.code}
                              </span>
                              <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                {categoryLabel[categoryKey] || categoryKey.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h2 className="text-xl font-black leading-tight text-slate-950 transition-colors group-hover:text-blue-800 dark:text-white dark:group-hover:text-blue-300">
                              {course.name}
                            </h2>
                            <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                              {course.description ||
                                'Comprehensive EASA Part-66 training designed for certification progress and practical readiness.'}
                            </p>
                            {course.requiresPrerequisite && course.prerequisites.length > 0 && (
                              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                Requires: {course.prerequisites.join(', ')}
                              </div>
                            )}
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                              <div className="flex items-center gap-2">
                                <Clock3 className="h-4 w-4 text-aerojet-sky" />
                                <span className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">
                                  Duration
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                                {course.duration ? `${course.duration} hrs` : 'Flexible'}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">
                                  Standard
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                                EASA P66
                              </p>
                            </div>
                          </div>

                          <div className="mt-auto pt-5">
                            <div className="flex items-end justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                              <div>
                                <p className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">
                                  Tuition
                                </p>
                                <div className="mt-1 flex items-baseline gap-2">
                                  <span className="text-xs font-bold text-aerojet-sky">
                                    {course.currency}
                                  </span>
                                  <span className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                                    {Number(course.price).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <p className="max-w-32 text-right text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                Enroll instantly when your pathway allows direct module purchase.
                              </p>
                            </div>

                            <div className="mt-4">
                              {isEnrolled ? (
                                <TrackedCourseLink
                                  courseId={course.id}
                                  href={`/student/courses/${enrollmentId}`}
                                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 px-5 text-xs font-black tracking-[0.2em] text-white uppercase transition-all hover:bg-emerald-600"
                                >
                                  Open Course
                                </TrackedCourseLink>
                              ) : isPending ? (
                                <div className="flex h-12 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-[10px] font-black tracking-[0.24em] text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                                  Verification Pending
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
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
