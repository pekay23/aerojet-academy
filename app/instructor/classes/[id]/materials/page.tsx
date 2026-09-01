import { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ChevronLeft,
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  ChevronRight,
  Info,
  FolderOpen,
  Mail,
} from 'lucide-react'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Course Materials | Instructor Portal' }
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') redirect('/login')

  const classData = await prismaUnfiltered.class.findUnique({
    where: { id },
    include: { course: true },
  })

  if (!classData) notFound()

  const resources = await prismaUnfiltered.generalResource.findMany({
    where: { showToInstructors: true },
    orderBy: { updatedAt: 'desc' },
  })

  const { course } = classData

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/instructor/classes"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-400 dark:text-slate-300 uppercase transition-colors hover:text-aerojet-sky"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to My Classes
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Course Materials
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-extrabold text-aerojet-sky">{course.code}</span>
            <span className="mx-2 inline-block h-1 w-1 rounded-full bg-slate-200 align-middle dark:bg-slate-700" />
            {course.name}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Syllabus Section */}
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase dark:text-white">
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

          {/* Learning Materials Section */}
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase dark:text-white">
                  Learning Materials
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  Guides, notes, and digital assets.
                </p>
              </div>
            </div>

            {course.materialsUrl ? (
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
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <Info className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                <p className="text-xs font-medium text-slate-400 italic">
                  No additional materials uploaded yet.
                </p>
              </div>
            )}
          </div>

          {/* General Resources */}
          {resources.length > 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase dark:text-white">
                    General Resources
                  </h2>
                  <p className="text-xs font-medium text-slate-500">
                    Shared resources available to all instructors.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-slate-800">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {resource.name}
                          </p>
                          {resource.description && (
                            <p className="mt-0.5 text-xs text-slate-400">{resource.description}</p>
                          )}
                        </div>
                      </div>
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm transition-all hover:bg-aerojet-blue hover:text-white active:scale-95 dark:bg-slate-700 dark:text-white"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-6 text-xs font-black tracking-widest text-slate-400 uppercase">
              Need to update materials?
            </h3>
            <div className="space-y-4">
              <p className="text-xs leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                Course materials and syllabi are managed by the administration team. If you need to
                upload or update resources for this course, please contact admin support.
              </p>
              <Link
                href="/instructor/resources"
                className="block w-full rounded-xl border border-slate-100 py-3 text-center text-xs font-black tracking-widest text-aerojet-blue uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                View All Resources
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-400" />
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                Contact Admin
              </h3>
            </div>
            <p className="mt-4 text-xs leading-relaxed font-medium text-slate-600 dark:text-slate-400">
              For material upload requests, corrections, or updates to course content, reach out to
              the academic administration office.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
