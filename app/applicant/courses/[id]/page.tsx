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
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Course Details | Applicant Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function CourseDetailsPage({ params }: Props) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params

  const [course, enrollment] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
    }),
    prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: (session.user as any).id,
          courseId: id,
        },
      },
    }),
  ])

  if (!course) notFound()

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header & Back Action */}
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
            <span className="font-mono text-xs font-black tracking-widest text-[#4c9ded]">
              {course.code}
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
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
          ) : (
            <Link
              href={`/applicant/courses/${id}/purchase`}
              className="inline-flex items-center justify-center rounded-xl bg-[#002a5c] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition-all hover:bg-[#003875] active:scale-95"
            >
              Enroll Now
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Description Card */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
              About this course
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-400">
                {course.description || 'No detailed description available for this course.'}
              </p>
            </div>
          </div>

          {/* Resources & Content */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#4c9ded]">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Syllabus</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Download the detailed curriculum.</p>
              {course.syllabusUrl ? (
                <a
                  href={course.syllabusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center text-sm font-bold text-[#002a5c] hover:underline"
                >
                  Download Syllabus
                  <ChevronRight className="h-4 w-4" />
                </a>
              ) : (
                <span className="mt-4 inline-block text-xs italic text-slate-400">
                  Not available yet
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Materials</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Access reading lists and study guides.</p>
              {course.materialsUrl ? (
                <a
                  href={course.materialsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center text-sm font-bold text-[#002a5c] hover:underline"
                >
                  View Materials
                  <ChevronRight className="h-4 w-4" />
                </a>
              ) : (
                <span className="mt-4 inline-block text-xs italic text-slate-400">
                  Not available yet
                </span>
              )}
            </div>
          </div>

          {/* Prerequisites */}
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
                      className="rounded-lg border border-blue-100 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-black text-[#002a5c] shadow-sm"
                    >
                      {code}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic text-slate-400">Check office for details</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="mb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Course Summary
            </h2>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Category
                  </p>
                  <p className="text-sm font-bold text-slate-700">{course.category || 'CORE'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Duration
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {course.duration ? `${course.duration} Hours` : 'TBD'}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Investment
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#002a5c]">
                    {course.currency} {Number(course.price).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-[10px] italic text-slate-400">
                  Price inclusive of training materials and exam fees.
                </p>
              </div>

              {!enrollment && (
                <Link
                  href={`/applicant/courses/${id}/purchase`}
                  className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#002a5c] py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition-all hover:bg-[#003875] active:scale-[0.98]"
                >
                  Enroll Now
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Training Quality</h3>
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
