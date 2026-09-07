import { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Download,
  Lock as LockIcon,
  Info,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  BookOpen,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { canAccessClasses, resolveEffectiveEnrollmentType } from '@/lib/enrollment/pathway'
import {
  getStudentCourseResources,
  getStudentGuideResources,
} from '@/lib/resources/student-course-resources'

interface PageProps {
  params: Promise<{ slug: string }>
}

type ResourceRow = {
  id: string
  name: string
  description: string | null
  url: string
  type: string
  category: string
  createdAt: string
  updatedAt: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

function fileTypeLabel(type: string): string {
  switch (type?.toUpperCase()) {
    case 'PDF':
      return 'PDF'
    case 'LINK':
      return 'Link'
    case 'DOC':
    case 'DOCX':
      return 'Document'
    case 'XLS':
    case 'XLSX':
      return 'Spreadsheet'
    case 'PPT':
    case 'PPTX':
      return 'Slides'
    case 'ZIP':
      return 'Archive'
    case 'IMG':
    case 'JPG':
    case 'PNG':
      return 'Image'
    case 'VIDEO':
    case 'MP4':
      return 'Video'
    default:
      return type || 'File'
  }
}

function humanCategory(c: string): string {
  if (!c) return 'General'
  return c
    .toLowerCase()
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const session = await getAuthSession()
  if (!session) return { title: 'Course Materials' }

  const enrollments = await prismaUnfiltered.enrollment.findMany({
    where: { userId: session.user.id },
    include: { course: true },
  })
  const enrollment = enrollments.find(
    (e) =>
      e.course.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-') === slug ||
      e.id === slug ||
      e.courseId === slug
  )
  return { title: enrollment ? `Resources: ${enrollment.course.name}` : 'Course Materials' }
}

export default async function MaterialsPage({ params }: PageProps) {
  const { slug } = await params
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const allEnrollments = await prismaUnfiltered.enrollment.findMany({
    where: { userId: session.user.id },
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

  const enrollment = allEnrollments.find(
    (e) =>
      e.course.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-') === slug ||
      e.id === slug ||
      e.courseId === slug
  )

  if (!enrollment || enrollment.userId !== session.user.id) {
    notFound()
  }

  // Payment gating
  const isPaid = ['ACTIVE', 'APPROVED'].includes(enrollment.status)

  if (!isPaid) {
    redirect(`/student/courses/${slug}?error=payment_required`)
  }

  const { course } = enrollment
  const enrollmentType =
    resolveEffectiveEnrollmentType({
      pathwayCode: enrollment.user.studentProfile?.pathwayRel?.code,
      enrollmentType: enrollment.user.studentProfile?.enrollmentType,
      programmeChoice: enrollment.user.studentProfile?.programmeChoice,
    }) || 'MODULAR'
  const allowClasses = canAccessClasses(enrollmentType)

  // Fetch course-linked materials + global student guides in parallel
  const [materialResources, studentGuides] = await Promise.all([
    getStudentCourseResources(course.id),
    getStudentGuideResources(),
  ])

  const hasLegacyMaterials = !!course.materialsUrl
  const hasAnyMaterial = hasLegacyMaterials || materialResources.length > 0

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-6xl space-y-10 duration-700 motion-reduce:animate-none motion-reduce:opacity-100">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/student/courses/${slug}`}
          className="group inline-flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-blue-800 dark:hover:text-blue-400"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to Course Detail
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-blue-800 uppercase sm:text-4xl dark:text-white">
              Course Resources
            </h1>
            <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="font-extrabold text-sky-400">{course.code}</span>
              <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              <span>{course.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 dark:bg-emerald-500/10">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-black tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
              Access Verified
            </span>
          </div>
        </div>

        {!allowClasses && (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-blue-800 dark:border-blue-500/10 dark:bg-blue-500/5 dark:text-blue-400">
            <Info aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p className="text-xs leading-relaxed font-bold">
              STUDY ONLY PATHWAY: You have full access to learning materials for this module. Live
              classroom sessions are not included in your current enrollment.
            </p>
          </div>
        )}
      </div>

      {/* Tables — full-width, sidebar below so tables can expand */}
      <div className="space-y-8">
        {/* Student Guide */}
        <div id="student-guide">
          <ResourceTable
            title="Student Guide"
            subtitle="Academy-wide handbooks and reference material."
            icon={<GraduationCap aria-hidden="true" className="h-6 w-6" />}
            iconClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10"
            emptyMessage="No student handbooks uploaded yet."
            rows={studentGuides}
          />
        </div>

        {/* Learning Materials */}
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
              <BookOpen aria-hidden="true" className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-blue-800 uppercase dark:text-white">
                Learning Materials
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Course-specific resources uploaded by admin and instructors.
              </p>
            </div>
          </div>

          {hasAnyMaterial ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black tracking-widest text-slate-600 uppercase dark:bg-slate-800/50">
                  <tr>
                    <th scope="col" className="w-12 px-4 py-3">#</th>
                    <th scope="col" className="px-4 py-3">Name</th>
                    <th scope="col" className="px-4 py-3">Description</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Type</th>
                    <th scope="col" className="px-4 py-3">Uploaded</th>
                    <th scope="col" className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {hasLegacyMaterials && (
                    <tr className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-xs font-bold text-slate-400">—</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <ExternalLink aria-hidden="true" className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              Study Guide Portal
                            </p>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                              External Resource
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        External study guide portal
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        External
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">Link</td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">—</td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={course.materialsUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-3 py-1.5 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-sky-400 active:scale-95"
                        >
                          Access
                        </a>
                      </td>
                    </tr>
                  )}
                  {materialResources.map((r, idx) => (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3 text-xs font-bold text-slate-400">
                        {hasLegacyMaterials ? idx + 2 : idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <FileText aria-hidden="true" className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {r.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {r.description || (
                          <><span className="sr-only">Not applicable</span><span aria-hidden="true" className="italic text-slate-300 dark:text-slate-600">—</span></>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {humanCategory(r.category)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {fileTypeLabel(r.type)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-all hover:bg-blue-800 hover:text-white active:scale-95 dark:bg-slate-800 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          aria-label={`Download ${r.name}`}
                        >
                          <Download aria-hidden="true" className="h-4 w-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <Info aria-hidden="true" className="mx-auto mb-2 h-5 w-5 text-slate-300" />
              <p className="text-xs font-medium text-slate-400 italic">
                No learning materials uploaded yet for this course.
              </p>
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/30">
            <h3 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
              <Info aria-hidden="true" className="h-3 w-3" />
              Usage Policy
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              These materials are proprietary to Aerojet Academy. Redistribution or external
              sharing is strictly prohibited and governed by the academy&apos;s digital usage policy.
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar — full-width grid below the tables so tables can expand */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-blue-800 p-1 shadow-lg dark:border-slate-800">
          <div className="rounded-[calc(1.5rem-1px)] bg-slate-900 p-8 text-white">
            <LockIcon aria-hidden="true" className="mb-4 h-8 w-8 text-sky-400" />
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
              className="block w-full rounded-xl border border-slate-100 py-3 text-center text-xs font-black tracking-widest text-blue-800 uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Reusable table card used by Student Guide section. */
function ResourceTable({
  title,
  subtitle,
  icon,
  iconClass,
  emptyMessage,
  rows,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  iconClass: string
  emptyMessage: string
  rows: ResourceRow[]
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-black tracking-tight text-blue-800 uppercase dark:text-white">
            {title}
          </h2>
          <p className="text-xs font-medium text-slate-500">{subtitle}</p>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black tracking-widest text-slate-600 uppercase dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="w-12 px-4 py-3">#</th>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Description</th>
                <th scope="col" className="px-4 py-3">Type</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r, idx) => (
                <tr
                  key={r.id}
                  className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3 text-xs font-bold text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <FileText aria-hidden="true" className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {r.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {r.description || (
                      <><span className="sr-only">Not applicable</span><span aria-hidden="true" className="italic text-slate-300 dark:text-slate-600">—</span></>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {fileTypeLabel(r.type)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-all hover:bg-blue-800 hover:text-white active:scale-95 dark:bg-slate-800 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      aria-label={`Open ${r.name}`}
                    >
                      <Download aria-hidden="true" className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <Info aria-hidden="true" className="mx-auto mb-2 h-5 w-5 text-slate-300" />
          <p className="text-xs font-medium text-slate-400 italic">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}


