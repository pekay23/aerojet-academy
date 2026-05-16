import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Clock, Globe, BookOpen, CheckCircle2, Lock } from 'lucide-react'
import { Suspense } from 'react'

import { CourseCategoryFilter } from '@/components/CourseCategoryFilter'
import TrackedCourseLink from '@/components/shared/TrackedCourseLink'
import TrackedImpression from '@/components/shared/TrackedImpression'
import { getAuthSession } from '@/lib/auth/helpers'
import { getCatalogVisibility, resolveEffectiveEnrollmentType } from '@/lib/enrollment/pathway'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Browse Courses | Applicant Portal' }
export const dynamic = 'force-dynamic'

const categoryColor: Record<string, string> = {
  FOUR_YEAR: 'bg-blue-50 text-blue-700 border-blue-200',
  TWO_YEAR: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MILITARY: 'bg-orange-50 text-orange-700 border-orange-200',
  MODULAR: 'bg-purple-50 text-purple-700 border-purple-200',
  EXAM_ONLY: 'bg-teal-50 text-teal-700 border-teal-200',
  REVISION: 'bg-slate-50 text-slate-700 border-slate-200',
}


function slugify(text: string) {
  return text?.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-') || '';
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const [portalState, allCategories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        programmeChoice: true,
        studentProfile: {
          select: {
            enrollmentType: true,
            pathwayRel: { select: { code: true } },
          },
        },
      },
    }),
    prisma.courseCategory.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  const effectiveEnrollmentType = resolveEffectiveEnrollmentType({
    pathwayCode: portalState?.studentProfile?.pathwayRel?.code,
    enrollmentType: portalState?.studentProfile?.enrollmentType,
    programmeChoice: portalState?.programmeChoice,
  })

  const canEnroll = session.user.status === 'ACTIVE'
  const visibility = getCatalogVisibility(effectiveEnrollmentType)

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-aerojet-blue/5 px-3 py-1 dark:bg-blue-500/10">
            <Globe className="h-3.5 w-3.5 text-aerojet-sky" />
            <span className="text-[10px] font-black tracking-widest text-aerojet-blue uppercase dark:text-blue-400">
              EASA Part-66 Certified
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue uppercase sm:text-4xl dark:text-white">
            Course Catalogue
          </h1>
          <p className="max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400">
            Explore current aviation modules, review real pricing, and follow the route that fits
            your study pathway.
          </p>
        </div>

        <div className="shrink-0">
          <CourseCategoryFilter categories={allCategories} currentCategory={category} />
        </div>
      </div>

      {!canEnroll && (
        <div className="group flex items-start gap-4 rounded-2xl border border-orange-200 bg-orange-50/50 p-6 transition-all hover:bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20">
            <Lock className="h-5 w-5 text-orange-600 dark:text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-black text-orange-900 dark:text-orange-400">
              Registration Approval Required
            </p>
            <p className="mt-1 text-xs leading-relaxed font-medium text-orange-700/80 dark:text-orange-500/60">
              Your account is currently in the verification phase. Once your registration payment is
              confirmed, you will gain full access to proceed with the correct enrollment route.
            </p>
          </div>
        </div>
      )}

      <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

      <Suspense fallback={<CoursesSkeleton />}>
        <CourseList
          category={category}
          canEnroll={canEnroll}
          enrollmentType={effectiveEnrollmentType}
          visibility={visibility}
        />
      </Suspense>
    </div>
  )
}

function CoursesSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  )
}

async function CourseList({
  category,
  canEnroll,
  enrollmentType,
  visibility,
}: {
  category?: string
  canEnroll: boolean
  enrollmentType: string | null
  visibility: ReturnType<typeof getCatalogVisibility>
}) {
  const coursesRaw = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(category ? { category: { name: category } } : {}),
    },
    include: {
      category: true,
      examComponents: {
        select: { poolPrice: true },
      },
    },
    orderBy: [{ category: { name: 'asc' } }, { code: 'asc' }],
  })

  const courses = coursesRaw.sort((a, b) =>
    a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
  )

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-700" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">No Modules Found</h3>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Try adjusting your category filter or check back later for new additions.
        </p>
      </div>
    )
  }

  const grouped = courses.reduce(
    (acc, course) => {
      const cat = course.category?.name || 'GENERAL'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(course)
      return acc
    },
    {} as Record<string, typeof courses>
  )

  const isExamOnly = enrollmentType === 'EXAM_ONLY'
  const isDirectPurchasePath = visibility.canPurchaseEasaModules || isExamOnly

  return (
    <div className="space-y-16">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase dark:text-aerojet-sky">
              {cat.replace(/_/g, ' ')}
            </h2>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800/50" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((course) => {
              const poolPrices = course.examComponents
                .map((component) => Number(component.poolPrice || 0))
                .filter((price) => price > 0)
              const displayPrice = isExamOnly
                ? poolPrices.length > 0
                  ? Math.min(...poolPrices)
                  : null
                : Number(course.price)
              const ctaHref = isDirectPurchasePath ? `/applicant/courses/${course.id}` : '/applicant/pathway'
              const ctaLabel = isExamOnly
                ? displayPrice
                  ? 'Book Exam'
                  : 'View Module'
                : isDirectPurchasePath
                  ? 'Enroll'
                  : 'Programme Route'

              return (
                <div
                  key={course.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-aerojet-sky/30 hover:shadow-xl hover:shadow-aerojet-blue/5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <TrackedImpression courseId={course.id} />
                  <div
                    className={`absolute top-0 left-0 h-1 w-full transition-all group-hover:h-1.5 ${
                      categoryColor[cat]?.split(' ')[2]?.replace('border-', 'bg-') || 'bg-slate-200'
                    }`}
                  />

                  <div className="flex flex-1 flex-col p-7">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-black tracking-widest text-aerojet-sky uppercase transition-colors group-hover:bg-aerojet-sky/10 dark:bg-slate-800">
                        {course.code}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide uppercase ${
                          categoryColor[cat] || 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {cat.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 className="text-xl leading-tight font-black text-aerojet-blue transition-colors group-hover:text-aerojet-sky dark:text-white dark:group-hover:text-blue-400">
                      {course.name}
                    </h3>

                    {course.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {course.description}
                      </p>
                    )}

                    <div className="mt-6 flex flex-wrap gap-4 text-[11px] font-bold text-slate-400">
                      {course.duration && (
                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-50 bg-slate-50/50 px-2 py-1 dark:border-slate-800 dark:bg-slate-800/30">
                          <Clock className="h-3.5 w-3.5 text-aerojet-sky" />
                          <span className="text-slate-600 dark:text-slate-300">
                            {course.duration.toLocaleString()} Hours
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-50 bg-slate-50/50 px-2 py-1 dark:border-slate-800 dark:bg-slate-800/30">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300">Certified</span>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-50 pt-6 dark:border-slate-800/50">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          {isExamOnly
                            ? 'Pool seat from'
                            : isDirectPurchasePath
                              ? 'Tuition'
                              : 'Programme access'}
                        </p>
                        <p className="truncate text-2xl font-black text-aerojet-blue dark:text-white">
                          {displayPrice !== null
                            ? `${course.currency} ${displayPrice.toLocaleString()}`
                            : 'By module'}
                        </p>
                      </div>
                      {canEnroll ? (
                        <TrackedCourseLink
                          courseId={course.id}
                          href={ctaHref}
                          className="inline-flex h-11 items-center justify-center rounded-xl bg-aerojet-blue px-6 text-xs font-black tracking-widest text-white uppercase ring-offset-white transition-all hover:bg-[#003875] hover:shadow-lg active:scale-95 sm:px-8 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                          {ctaLabel}
                        </TrackedCourseLink>
                      ) : (
                        <span className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-xl bg-slate-50 px-6 text-xs font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/50">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
