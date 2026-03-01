import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
} from 'lucide-react'
import CourseActionsMenu from '../../_components/CourseActionsMenu'
import ExamComponentsSection from './_components/ExamComponentsSection'
import CourseInfoEditDialog from './_components/CourseInfoEditDialog'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Course Details | Staff Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function CourseDetailsPage({ params }: Props) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      examComponents: {
        include: { _count: { select: { exams: true, bookings: true } } },
        orderBy: { code: 'asc' },
      },
      _count: {
        select: {
          enrollments: true,
          classes: true,
          examComponents: true,
        },
      },
      classes: {
        include: {
          instructor: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
        orderBy: { startDate: 'desc' },
      },
    },
  })

  if (!course) notFound()

  const categories = await prisma.courseCategory.findMany({
    orderBy: { name: 'asc' },
  })

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/staff/courses"
          className="mb-4 inline-flex items-center text-sm font-bold text-slate-400 transition-colors hover:text-[#002a5c]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Courses
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-black text-blue-600 shadow-sm">
              <BookOpen className="h-10 w-10" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-slate-400">{course.code}</span>
                {course.isActive ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 uppercase">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500 uppercase dark:text-slate-400">
                    Inactive
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
                {course.name}
              </h1>
            </div>
          </div>
          <CourseActionsMenu courseId={course.id} courseName={course.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* About Course */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                About Course
              </h2>
              <CourseInfoEditDialog course={course} categories={categories} />
            </div>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              {course.description || 'No description provided for this course.'}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">Price</p>
                <div className="flex items-center gap-2 font-black text-slate-700">
                  <DollarSign className="h-4 w-4 text-[#4c9ded]" />
                  {course.currency} {course.price.toString()}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                <div className="flex items-center gap-2 font-black text-slate-700">
                  <Clock className="h-4 w-4 text-[#4c9ded]" />
                  {course.duration ? `${course.duration} Hours` : 'N/A'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">Category</p>
                <div className="flex items-center gap-2 font-black text-slate-700">
                  <GraduationCap className="h-4 w-4 text-[#4c9ded]" />
                  {course.categoryId || 'Standard'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">Prerequisites</p>
                <div className="flex items-center gap-2 font-black text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-[#4c9ded]" />
                  {course.requiresPrerequisite ? course.prerequisites.join(', ') : 'None'}
                </div>
              </div>
            </div>
          </div>

          {/* Exam Components */}
          <ExamComponentsSection
            courseId={course.id}
            currency={course.currency}
            components={course.examComponents.map((ec) => ({
              ...ec,
              individualPrice: ec.individualPrice?.toString() ?? null,
              poolPrice: ec.poolPrice?.toString() ?? null,
            }))}
          />

          {/* Scheduled Classes */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                Scheduled Classes
              </h2>
              <Link
                href="/staff/classes/create"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                + Schedule New
              </Link>
            </div>

            <div className="space-y-4">
              {course.classes.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No classes currently scheduled.</p>
              ) : (
                course.classes.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/staff/classes/${cls.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div>
                      <p className="font-bold text-slate-700">{cls.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {cls.instructor?.user.profile
                          ? `Instructor: ${cls.instructor.user.profile.firstName} ${cls.instructor.user.profile.lastName}`
                          : 'Unassigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {new Date(cls.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Starts</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
              <Users className="h-4 w-4" /> Enrollment Stats
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total Enrolled
                </span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                  {course._count.enrollments}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Active Classes
                </span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                  {course._count.classes}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
              <Calendar className="h-4 w-4" /> Course Lifecycle
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 dark:text-slate-400">Created</span>
                <span className="font-bold text-slate-700">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 dark:text-slate-400">Last Updated</span>
                <span className="font-bold text-slate-700">
                  {new Date(course.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
