import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  FileText,
  Clock,
  ArrowLeft,
  ChevronRight,
  Package,
  Activity,
  HelpCircle,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: { course: true },
  })
  return { title: enrollment ? `${enrollment.course.name} | Student Portal` : 'Course Details' }
}

export default async function CourseDetailsPage({ params }: PageProps) {
  const { id } = await params
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          classes: {
            where: {
              attendanceRecords: {
                some: { userId: session.user.id },
              },
            },
          },
        },
      },
    },
  })

  if (!enrollment || enrollment.userId !== session.user.id) {
    notFound()
  }

  const { course } = enrollment

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        href="/student/courses"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6">
              <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black tracking-widest text-blue-600 uppercase">
                {course.category || 'CORE'}
              </span>
              <h1 className="mt-3 text-3xl leading-tight font-black tracking-tight text-slate-900 dark:text-slate-100">
                {course.name}
              </h1>
              <p className="mt-1 text-xs font-black tracking-widest text-[#4c9ded]">
                {course.code}
              </p>
            </div>

            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              {course.description || 'No description available.'}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800/50">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                    Duration
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {course.duration || 'Flexible'} Hours
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800/50">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                    Enrollment Status
                  </p>
                  <p className="text-sm font-bold text-slate-700">{enrollment.status}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Course Resources
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 p-5 transition-all hover:border-blue-100 hover:bg-blue-50/20 dark:border-slate-800">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#4c9ded]">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Syllabus</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Detailed course curriculum.
                </p>
                {course.syllabusUrl ? (
                  <a
                    href={course.syllabusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center text-xs font-bold text-[#002a5c] hover:underline"
                  >
                    Download Syllabus
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  <span className="mt-4 inline-block text-[10px] text-slate-400 italic">
                    Not available
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 p-5 transition-all hover:border-indigo-100 hover:bg-indigo-50/20 dark:border-slate-800">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                  <Package className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Materials</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Learning guides and assets.
                </p>
                {course.materialsUrl ? (
                  enrollment?.status === 'APPROVED' || enrollment?.status === 'ACTIVE' ? (
                    <a
                      href={course.materialsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center text-xs font-bold text-[#002a5c] hover:underline dark:text-[#4c9ded]"
                    >
                      View Materials
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </a>
                  ) : (
                    <span className="mt-4 inline-block text-[10px] font-bold text-slate-400 italic">
                      Available after paying for a course
                    </span>
                  )
                ) : (
                  <span className="mt-4 inline-block text-[10px] text-slate-400 italic">
                    Not available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full space-y-6 lg:w-80">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-black text-slate-900 dark:text-slate-100">
              Your Progress
            </h3>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-bold tracking-widest text-slate-400 uppercase">
                  <span>Attendance</span>
                  <span>—</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className="h-full w-0 rounded-full bg-blue-600 transition-all" />
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-50 pt-4">
                <Link
                  href="/student/attendance"
                  className="flex items-center justify-between text-sm font-bold text-slate-600 hover:text-blue-600 dark:text-slate-400"
                >
                  View Full Attendance
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/student/grades"
                  className="flex items-center justify-between text-sm font-bold text-slate-600 hover:text-blue-600 dark:text-slate-400"
                >
                  View Course Grades
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-white dark:bg-slate-900/10">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-black italic">Need Help?</h3>
            <p className="mb-4 text-sm leading-relaxed font-medium text-slate-400">
              If you have questions about the curriculum or materials, please contact the academy
              office or your instructor.
            </p>
            <Link
              href="/student/messages"
              className="block w-full rounded-xl bg-white py-3 text-center text-sm font-black text-slate-900 transition-transform hover:bg-slate-50 active:scale-95 dark:bg-slate-900 dark:text-slate-100"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
