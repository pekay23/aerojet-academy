import { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  GraduationCap,
  ShieldCheck,
  FileText,
  Package,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import { resolveEffectiveEnrollmentType } from '@/lib/enrollment/pathway'
import { prismaUnfiltered } from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Course Details | Applicant Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function CourseDetailsPage({ params }: Props) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params
  const userId = session.user.id

  
  function slugify(text: string) {
    return text?.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-') || '';
  }

  const allCourses = await prismaUnfiltered.course.findMany({ select: { id: true, name: true, code: true } });
  const matchedCourse = allCourses.find(c => slugify(c.name) === id || slugify(c.code) === id);
  const targetId = matchedCourse ? matchedCourse.id : id;

  const [course, enrollment] = await Promise.all([
    prismaUnfiltered.course.findUnique({
      where: { id: targetId },
      include: { category: true },
    }),
    prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: targetId,
      },
    }),
  ])

  if (!course) notFound()

  const [applicantState, examComponents, wallet] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        programmeChoice: true,
        studentProfile: {
          select: {
            enrollmentType: true,
            pathwayRel: { select: { code: true } },
            licenseTargets: {
              include: { licenseCategory: true },
            },
          },
        },
      },
    }),
    prisma.examComponent.findMany({
      where: { courseId: targetId },
      orderBy: { code: 'asc' },
    }),
    prisma.wallet.findUnique({
      where: { userId },
      select: { availableBalance: true },
    }),
  ])

  const studentProfile = applicantState?.studentProfile
  const effectiveEnrollmentType = resolveEffectiveEnrollmentType({
    pathwayCode: studentProfile?.pathwayRel?.code,
    enrollmentType: studentProfile?.enrollmentType,
    programmeChoice: applicantState?.programmeChoice,
  })
  const isExamOnly = effectiveEnrollmentType === 'EXAM_ONLY'
  const balance = Number(wallet?.availableBalance || 0)
  const lowestPoolPrice =
    examComponents.length > 0
      ? Math.min(...examComponents.map((component) => Number(component.poolPrice || 300)))
      : 300
  const canAffordPool = balance >= lowestPoolPrice

  const targetLicenseCodes = studentProfile?.licenseTargets
    .map((lt) => lt.licenseCategory.code)
    .join(', ')

  const isRequiredForTarget = await prisma.licenseModuleRequirement.findFirst({
    where: {
      courseId: targetId,
      licenseCategory: {
        code: { in: studentProfile?.licenseTargets.map((lt) => lt.licenseCategory.code) || [] },
      },
    },
  })

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/applicant/courses"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono text-xs font-black tracking-widest text-aerojet-sky">
              {course.code}
            </span>
            <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
              {course.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {enrollment ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Already Enrolled
            </div>
          ) : isExamOnly ? (
            <div className="flex flex-col items-end gap-2">
              <Link
                href={
                  canAffordPool ? `/applicant/courses/${targetId}/purchase` : '/applicant/wallet-top-up'
                }
                className={`inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${
                  canAffordPool
                    ? 'bg-aerojet-blue shadow-blue-900/10 hover:bg-[#003875]'
                    : 'bg-orange-600 shadow-orange-900/10 hover:bg-orange-700'
                }`}
              >
                {canAffordPool ? 'Book Exam' : 'Top Up Wallet to Book'}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
              {!canAffordPool && (
                <p className="animate-pulse text-[10px] font-bold text-orange-600">
                  Insufficient Balance: EUR {balance.toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <Link
              href={`/applicant/courses/${targetId}/purchase`}
              className="inline-flex items-center justify-center rounded-xl bg-aerojet-blue px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition-all hover:bg-[#003875] active:scale-95"
            >
              Enroll Now
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              About this course
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                {course.description || 'No detailed description available for this course.'}
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-aerojet-sky">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Syllabus</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Download the detailed curriculum.
              </p>
              {course.syllabusUrl ? (
                <a
                  href={course.syllabusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center text-sm font-bold text-aerojet-blue hover:underline"
                >
                  Download Syllabus
                  <ChevronRight className="h-4 w-4" />
                </a>
              ) : (
                <span className="mt-4 inline-block text-xs text-slate-400 italic">
                  Not available yet
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Materials</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Access reading lists and study guides.
              </p>
              {course.materialsUrl ? (
                enrollment?.status === 'APPROVED' || enrollment?.status === 'ACTIVE' ? (
                  <a
                    href={course.materialsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center text-sm font-bold text-aerojet-blue hover:underline dark:text-aerojet-sky"
                  >
                    View Materials
                    <ChevronRight className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="mt-4 inline-block text-xs font-bold text-slate-400 italic">
                    Available after paying for a course
                  </span>
                )
              ) : (
                <span className="mt-4 inline-block text-xs text-slate-400 italic">
                  Not available yet
                </span>
              )}
            </div>
          </div>

          {course.requiresPrerequisite && (
            <div className="rounded-2xl border border-blue-50 bg-blue-50/20 p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Prerequisites</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This course requires completion of the following modules:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {course.prerequisites.length > 0 ? (
                  course.prerequisites.map((code) => (
                    <span
                      key={code}
                      className="rounded-lg border border-blue-100 bg-white px-3 py-1.5 text-xs font-black text-aerojet-blue shadow-sm dark:bg-slate-900"
                    >
                      {code}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Check office for details</span>
                )}
              </div>
            </div>
          )}

          {isExamOnly && examComponents.length > 0 && (
            <div className="rounded-2xl border border-teal-100 bg-teal-50/20 p-6 dark:border-teal-900/30 dark:bg-teal-900/10">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Available Exams</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {examComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex flex-col gap-2 rounded-xl border border-white bg-white/50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-black tracking-widest text-aerojet-sky">
                        {comp.code}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {comp.type || 'EXAM'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {comp.name}
                    </h4>
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Pool Price</p>
                        <p className="text-sm font-black text-teal-600">
                          EUR {Number(comp.poolPrice).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Individual</p>
                        <p className="text-sm font-black text-aerojet-blue dark:text-blue-400">
                          EUR {Number(comp.individualPrice).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Course Summary
            </h2>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                    Category
                  </p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {course.category?.name || course.categoryId || 'CORE'}
                  </p>
                  {isRequiredForTarget && (
                    <p className="mt-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      Target: {targetLicenseCodes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                    Duration
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {course.duration ? `${course.duration} Hours` : 'TBD'}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-5">
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                  {isExamOnly ? 'Pool seat from' : 'Price'}
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-black text-aerojet-blue dark:text-blue-400">
                    {course.currency}{' '}
                    {isExamOnly
                      ? lowestPoolPrice.toLocaleString()
                      : Number(course.price).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-slate-400 italic">
                  {isExamOnly
                    ? 'Shown from the live exam component pool pricing for this module.'
                    : 'Price inclusive of training materials and exam fees.'}
                </p>
              </div>

              {!enrollment && (
                <Link
                  href={
                    isExamOnly && !canAffordPool
                      ? '/applicant/wallet-top-up'
                      : `/applicant/courses/${targetId}/purchase`
                  }
                  className={`mt-6 flex w-full items-center justify-center rounded-xl py-3 text-sm font-black text-white shadow-lg transition-all active:scale-[0.98] ${
                    isExamOnly && !canAffordPool
                      ? 'bg-orange-600 shadow-orange-900/10 hover:bg-orange-700'
                      : 'bg-aerojet-blue shadow-blue-900/10 hover:bg-[#003875]'
                  }`}
                >
                  {isExamOnly ? (canAffordPool ? 'Book Exam' : 'Top Up Wallet') : 'Enroll Now'}
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Training Quality
              </h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              All our courses follow strictly EASA Part-147 standards with certified instructors and
              modern training facilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
