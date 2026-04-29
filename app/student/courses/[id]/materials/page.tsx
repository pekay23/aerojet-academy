import { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Download,
  Lock as LockIcon,
  BookOpen,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { canAccessClasses, resolveEffectiveEnrollmentType } from '@/lib/enrollment/pathway'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: { course: true },
  })
  return { title: enrollment ? `Resources: ${enrollment.course.name}` : 'Course Materials' }
}

export default async function MaterialsPage({ params }: PageProps) {
  const { id } = await params
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      course: true,
      user: {
        select: {
          studentProfile: {
            select: {
              enrollmentType: true,
              programmeChoice: true,
              pathwayRel: { select: { code: true } },
            },
          },
        },
      },
    },
  })

  if (!enrollment || enrollment.userId !== session.user.id) {
    notFound()
  }

  // Payment Gating Logic
  const isPaid = ['ACTIVE', 'APPROVED'].includes(enrollment.status)

  if (!isPaid) {
    // If accessed via direct URL, redirect back to course details with a message
    redirect(`/student/courses/${id}?error=payment_required`)
  }

  const { course } = enrollment
  const enrollmentType =
    resolveEffectiveEnrollmentType({
      pathwayCode: enrollment.user.studentProfile?.pathwayRel?.code,
      enrollmentType: enrollment.user.studentProfile?.enrollmentType,
      programmeChoice: enrollment.user.studentProfile?.programmeChoice,
    }) || 'MODULAR'
  const allowClasses = canAccessClasses(enrollmentType)

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/student/courses/${id}`}
          className="group inline-flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-aerojet-blue dark:hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course Detail
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-aerojet-blue uppercase sm:text-4xl dark:text-white">
              Course Resources
            </h1>
            <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="font-extrabold text-aerojet-sky">{course.code}</span>
              <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              <span>{course.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 dark:bg-emerald-500/10">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-black tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
              Access Verified
            </span>
          </div>
        </div>

        {!allowClasses && (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-aerojet-blue dark:border-blue-500/10 dark:bg-blue-500/5 dark:text-blue-400">
            <Info className="h-5 w-5 shrink-0" />
            <p className="text-xs leading-relaxed font-bold">
              STUDY ONLY PATHWAY: You have full access to learning materials for this module. Live
              classroom sessions are not included in your current enrollment.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Resource Column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Syllabus Section */}
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-aerojet-blue uppercase dark:text-white">
                  Course Syllabus
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  Official curriculum and learning objectives.
                </p>
              </div>
            </div>

            {course.syllabusUrl ? (
              <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-slate-800">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Course_Syllabus_{course.code}.pdf
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase">PDF Document</p>
                    </div>
                  </div>
                  <a
                    href={course.syllabusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm transition-all hover:bg-aerojet-blue hover:text-white active:scale-95 dark:bg-slate-700 dark:text-white"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <Info className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                <p className="text-xs font-medium text-slate-400 italic">
                  No syllabus document uploaded yet.
                </p>
              </div>
            )}
          </div>

          {/* Training Materials Section */}
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-aerojet-blue uppercase dark:text-white">
                  Learning Materials
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  Guides, notes, and digital assets.
                </p>
              </div>
            </div>

            {course.materialsUrl ? (
              <div className="space-y-4">
                <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/30">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-slate-800">
                        <ExternalLink className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Study Guide Portal
                        </p>
                        <p className="text-xs font-bold text-slate-400 uppercase">
                          External Resource
                        </p>
                      </div>
                    </div>
                    <a
                      href={course.materialsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2 text-xs font-black tracking-widest text-white uppercase transition-all hover:bg-aerojet-sky active:scale-95"
                    >
                      Access
                      <ChevronRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/30">
                  <h4 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
                    <Info className="h-3 w-3" />
                    Usage Policy
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    These materials are proprietary to Aerojet Academy. Redistribution or external
                    sharing is strictly prohibited and governed by the academy&apos;s digital usage
                    policy.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <Info className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                <p className="text-xs font-medium text-slate-400 italic">
                  No additional materials uploaded yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-aerojet-blue p-1 shadow-lg dark:border-slate-800">
            <div className="rounded-[calc(1.5rem-1px)] bg-slate-900 p-8 text-white">
              <LockIcon className="mb-4 h-8 w-8 text-aerojet-sky" />
              <h3 className="text-xl font-black tracking-tight italic">Security Notice</h3>
              <p className="mt-4 text-sm leading-relaxed font-medium text-slate-400">
                Your access is tied to your verified enrollment. Session-based monitoring is active
                for all resource downloads.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-6 text-xs font-black tracking-widest text-slate-400 uppercase">
              Need more help?
            </h3>
            <div className="space-y-4">
              <p className="text-xs leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                If you are experiencing issues accessing specific documents, please contact
                technical support or your instructor directly.
              </p>
              <Link
                href="/student/messages"
                className="block w-full rounded-xl border border-slate-100 py-3 text-center text-xs font-black tracking-widest text-aerojet-blue uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
