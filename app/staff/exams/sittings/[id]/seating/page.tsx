import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import SeatingAssignment from '@/app/staff/classrooms/[id]/_components/SeatingAssignment'

export const metadata: Metadata = {
  title: 'Seating Assignment | Staff Portal',
  description: 'Assign candidates to seats for an exam sitting.',
}

export default async function SittingSeatingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getAuthSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    redirect('/login')
  }

  const { id: sittingId } = await params

  const [sitting, classroomWithSeats] = await Promise.all([
    prismaUnfiltered.examSitting.findUnique({
      where: { id: sittingId },
      include: {
        event: { select: { id: true, name: true } },
        examComponent: {
          select: { code: true, name: true, course: { select: { code: true, name: true } } },
        },
        assignments: {
          include: {
            user: {
              include: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
            seat: true,
          },
          orderBy: { assignedAt: 'asc' },
        },
      },
    }),
    prismaUnfiltered.classroom.findFirst({
      where: {
        layout: { not: Prisma.DbNull },
      },
      include: {
        seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!sitting) notFound()

  const layout = classroomWithSeats?.layout as {
    rows: number
    cols: number
    cells: { row: number; col: number; type: string; label: string | null }[]
  } | null

  const sittingLabel = `${sitting.examComponent.course?.code || sitting.examComponent.code} — Day ${sitting.dayNumber} ${sitting.sessionType}`

  const students = sitting.assignments.map((a) => ({
    assignmentId: a.id,
    userId: a.userId,
    name: a.user.profile
      ? `${a.user.profile.firstName} ${a.user.profile.lastName}`
      : a.user.email,
    seatId: a.seatId,
    seatLabel: a.seat?.label ?? null,
  }))

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <Link
          href={`/staff/exams/events/${sitting.event.id}`}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-aerojet-sky"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {sitting.event.name}
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Seating Assignment
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {sitting.examComponent.course?.code || sitting.examComponent.code} —{' '}
          {sitting.examComponent.name} | Day {sitting.dayNumber},{' '}
          {sitting.sessionType} |{' '}
          {format(new Date(sitting.startTime), 'MMM d, yyyy h:mm a')}
        </p>
      </div>

      {/* Content */}
      {!classroomWithSeats || !layout ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
          <AlertCircle className="mb-4 h-12 w-12 text-amber-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Floor Plan Available
          </h3>
          <p className="mt-2 max-w-md text-center text-sm text-slate-500 dark:text-slate-400">
            You need to design a floor plan for a classroom before you can assign seats.
            Go to{' '}
            <Link
              href="/staff/classrooms"
              className="font-bold text-aerojet-sky hover:underline"
            >
              Facilities Management
            </Link>{' '}
            to set up a room layout.
          </p>
        </div>
      ) : (
        <SeatingAssignment
          sittingId={sittingId}
          sittingLabel={sittingLabel}
          layout={layout}
          seats={classroomWithSeats.seats.map((s) => ({
            id: s.id,
            row: s.row,
            col: s.col,
            label: s.label,
            isEnabled: s.isEnabled,
          }))}
          students={students}
        />
      )}
    </div>
  )
}
