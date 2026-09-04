import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Users,
  _MapPin,
  Calendar,
  Clock,
  User as UserIcon,
  _Shield,
  Armchair,
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

  function slugify(text: string) {
    return text?.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-') || '';
  }

  // Fallback: If id is a slug, find the class by name
  let targetId = id
  if (id.length < 20) {
    const allBasicClasses = await prismaUnfiltered.class.findMany({ select: { id: true, name: true } })
    const matchedClass = allBasicClasses.find(c => slugify(c.name) === id)
    if (matchedClass) targetId = matchedClass.id
  }

  const cls = await prismaUnfiltered.class.findUnique({
    where: { id: targetId },
    include: {
      course: true,
      semester: true,
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
    <div className="mx-auto max-w-[1800px]">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/staff/classes"
          className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-slate-400 transition-all duration-150 ease-out hover:bg-slate-100 hover:text-aerojet-blue dark:hover:bg-slate-800/60"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Classes
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-aerojet-blue/5 text-3xl font-black text-aerojet-blue shadow-sm">
              <Users className="h-10 w-10 text-aerojet-sky" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-slate-400">
                  {cls.course.code}
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700 uppercase">
                  {cls.semester?.name || 'Current Semester'}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
                {cls.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {cls.classroomId && (
              <Link
                href={`/staff/classes/${cls.id}/seating`}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:border-aerojet-sky hover:text-aerojet-blue dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              >
                <Armchair className="h-4 w-4" />
                Manage Seating
              </Link>
            )}
            <ClassActionsMenu classId={cls.id} className={cls.name || ''} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Class Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-xs font-black tracking-widest text-slate-400 uppercase">
              Class Information
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">Course</p>
                <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-200">
                  <BookOpen className="h-4 w-4 text-aerojet-sky" />
                  {cls.course.name}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">Instructor</p>
                <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-200">
                  <UserIcon className="h-4 w-4 text-aerojet-sky" />
                  {instructorName}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">
                  Current Occupancy
                </p>
                <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-200">
                  <Users className="h-4 w-4 text-aerojet-sky" />
                  {cls.currentStudents} / {cls.maxStudents} Students
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-xs font-black tracking-widest text-slate-400 uppercase">
              Description
            </h2>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              {cls.description || 'No specific description for this class instance.'}
            </p>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
              <Calendar className="h-4 w-4" /> Schedule
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">Start Date</p>
                <p className="font-black text-slate-700 dark:text-slate-200">
                  {new Date(cls.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">End Date</p>
                <p className="font-black text-slate-700 dark:text-slate-200">
                  {new Date(cls.endDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
              <Clock className="h-4 w-4" /> Weekly Timeline
            </h2>
            <div className="space-y-2">
              {cls.schedule ? (
                <pre className="text-xs font-bold whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {JSON.stringify(serializePrisma(cls.schedule), null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-slate-400 italic">No specific weekly schedule set.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
