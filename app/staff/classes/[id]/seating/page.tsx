import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import ClassSeatingAssignment from './_components/ClassSeatingAssignment'

export const metadata: Metadata = {
  title: 'Class Seating | Staff Portal',
  description: 'Manage seating arrangement for a class.',
}

export default async function ClassSeatingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getAuthSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    redirect('/login')
  }

  const { id } = await params

  const cls = await prismaUnfiltered.class.findUnique({
    where: { id },
    include: {
      course: { select: { code: true, name: true } },
      classroom: {
        include: {
          seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
        },
      },
    },
  })

  if (!cls) notFound()

  if (!cls.classroom || !cls.classroom.layout) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div>
          <Link
            href={`/staff/classes/${id}`}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-aerojet-sky"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {cls.name}
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Class Seating
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
          <AlertCircle className="mb-4 h-12 w-12 text-amber-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Floor Plan Available
          </h3>
          <p className="mt-2 max-w-md text-center text-sm text-slate-500 dark:text-slate-400">
            The assigned classroom doesn't have a floor plan yet. Go to{' '}
            <Link
              href={`/staff/classrooms/${cls.classroomId}`}
              className="font-bold text-aerojet-sky hover:underline"
            >
              design its layout
            </Link>{' '}
            first.
          </p>
        </div>
      </div>
    )
  }

  // Get enrolled students from attendance records
  const attendanceUsers = await prismaUnfiltered.attendanceRecord.findMany({
    where: { classId: id },
    distinct: ['userId'],
    select: {
      userId: true,
      user: {
        include: {
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })

  const layout = cls.classroom.layout as {
    rows: number
    cols: number
    cells: { row: number; col: number; type: string; label: string | null }[]
  }

  // For class seating, we use settings stored in the user's settings JSON
  // The simple approach: we store seat assignments as classroom-level data
  const students = attendanceUsers.map((a) => ({
    id: a.userId,
    name: a.user.profile
      ? `${a.user.profile.firstName} ${a.user.profile.lastName}`
      : 'Unknown',
  }))

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <Link
          href={`/staff/classes/${id}`}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-aerojet-sky"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {cls.name}
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Class Seating — {cls.course.code}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {cls.name} | Room: {cls.classroom.name} | Capacity: {cls.classroom.capacity}
        </p>
      </div>

      <ClassSeatingAssignment
        classId={id}
        classroomId={cls.classroom.id}
        layout={layout}
        seats={cls.classroom.seats.map((s) => ({
          id: s.id,
          row: s.row,
          col: s.col,
          label: s.label,
          isEnabled: s.isEnabled,
        }))}
        students={students}
      />
    </div>
  )
}
