import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Users,
  MapPin,
  Calendar,
  Clock,
  User as UserIcon,
  Shield,
} from 'lucide-react'
import ClassActionsMenu from '../../_components/ClassActionsMenu'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Class Details | Staff Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClassDetailsPage({ params }: Props) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      course: true,
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
  })

  if (!cls) notFound()

  const instructorName = cls.instructor?.user.profile
    ? `${cls.instructor.user.profile.firstName} ${cls.instructor.user.profile.lastName}`
    : 'Unassigned'

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/staff/classes"
          className="mb-4 inline-flex items-center text-sm font-bold text-slate-400 transition-colors hover:text-[#002a5c]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Classes
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#002a5c]/5 text-3xl font-black text-[#002a5c] shadow-sm">
              <Users className="h-10 w-10 text-[#4c9ded]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-slate-400">
                  {cls.course.code}
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">
                  {cls.semester || 'Current Semester'}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">{cls.name}</h1>
            </div>
          </div>
          <ClassActionsMenu classId={cls.id} className={cls.name || ''} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Class Details */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
              Class Information
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">Course</p>
                <div className="flex items-center gap-2 font-black text-slate-700">
                  <BookOpen className="h-4 w-4 text-[#4c9ded]" />
                  {cls.course.name}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">Instructor</p>
                <div className="flex items-center gap-2 font-black text-slate-700">
                  <UserIcon className="h-4 w-4 text-[#4c9ded]" />
                  {instructorName}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">
                  Current Occupancy
                </p>
                <div className="flex items-center gap-2 font-black text-slate-700">
                  <Users className="h-4 w-4 text-[#4c9ded]" />
                  {cls.currentStudents} / {cls.maxStudents} Students
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
              Description
            </h2>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              {cls.description || 'No specific description for this class instance.'}
            </p>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Calendar className="h-4 w-4" /> Schedule
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">Start Date</p>
                <p className="font-black text-slate-700">
                  {new Date(cls.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">End Date</p>
                <p className="font-black text-slate-700">
                  {new Date(cls.endDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Clock className="h-4 w-4" /> Weekly Timeline
            </h2>
            <div className="space-y-2">
              {cls.schedule ? (
                <pre className="whitespace-pre-wrap text-xs font-bold text-slate-700">
                  {JSON.stringify(cls.schedule, null, 2)}
                </pre>
              ) : (
                <p className="text-xs italic text-slate-400">No specific weekly schedule set.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
