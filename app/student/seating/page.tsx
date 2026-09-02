import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { Armchair, MapPin, BookOpen, Calendar, Ban } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'My Seating | Student Portal',
  description: 'View your seating assignments for classes and exams.',
}

interface LayoutData {
  rows: number
  cols: number
  cells: { row: number; col: number; type: string; label: string | null }[]
}

export default async function StudentSeatingPage() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')

  const userId = session.user.id

  // 1. Fetch class attendance and exam assignments in parallel
  const [myClasses, examAssignments] = await Promise.all([
    prismaUnfiltered.attendanceRecord.findMany({
      where: { userId },
      distinct: ['classId'],
      select: {
        classId: true,
        class: {
          include: {
            course: { select: { code: true, name: true } },
            classroom: {
              include: {
                seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
              },
            },
          },
        },
      },
    }),
    prismaUnfiltered.examSittingAssignment.findMany({
      where: {
        userId,
        seatId: { not: null },
      },
      take: 50,
      include: {
        seat: {
          include: {
            classroom: {
              include: {
                seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
              },
            },
          },
        },
        sitting: {
          include: {
            examComponent: {
              select: { code: true, name: true, course: { select: { code: true } } },
            },
            event: { select: { name: true } },
          },
        },
      },
    }),
  ])

  // Load class seating assignments from system settings (depends on myClasses)
  const classesWithLayout = myClasses.filter(
    (c) => c.class.classroom?.layout
  )
  const classSeatingKeys = classesWithLayout.map(
    (c) => `class_seating_${c.classId}`
  )
  const classSeatingSettings =
    classSeatingKeys.length > 0
      ? await prismaUnfiltered.systemSetting.findMany({
          where: { key: { in: classSeatingKeys } },
        })
      : []
  const classSeatingMap: Record<string, Record<string, string>> = {}
  for (const s of classSeatingSettings) {
    const classId = s.key.replace('class_seating_', '')
    classSeatingMap[classId] = JSON.parse(s.value)
  }

  // Build class seat info
  type ClassSeatInfo = {
    classId: string
    className: string
    courseCode: string
    roomName: string
    mySeatLabel: string | null
    mySeatId: string | null
    layout: LayoutData
    seats: { id: string; row: number; col: number; label: string | null }[]
  }

  const classSeatInfos: ClassSeatInfo[] = []
  for (const c of classesWithLayout) {
    const assignments = classSeatingMap[c.classId] || {}
    // Find which seat this student is assigned to
    const mySeatEntry = Object.entries(assignments).find(([, uid]) => uid === userId)
    const mySeatId = mySeatEntry?.[0] ?? null
    const mySeat = mySeatId
      ? c.class.classroom!.seats.find((s) => s.id === mySeatId)
      : null

    classSeatInfos.push({
      classId: c.classId,
      className: c.class.name,
      courseCode: c.class.course.code,
      roomName: c.class.classroom!.name,
      mySeatLabel: mySeat?.label ?? null,
      mySeatId,
      layout: c.class.classroom!.layout as unknown as LayoutData,
      seats: c.class.classroom!.seats.map((s) => ({
        id: s.id,
        row: s.row,
        col: s.col,
        label: s.label,
      })),
    })
  }

  // Build exam seat info
  type ExamSeatInfo = {
    eventName: string
    componentCode: string
    componentName: string
    dayNumber: number
    sessionType: string
    startTime: Date
    mySeatLabel: string | null
    mySeatId: string
    layout: LayoutData | null
    seats: { id: string; row: number; col: number; label: string | null }[]
  }

  const examSeatInfos: ExamSeatInfo[] = examAssignments
    .filter((a) => a.seat?.classroom?.layout)
    .map((a) => ({
      eventName: a.sitting.event?.name || 'Exam',
      componentCode:
        a.sitting.examComponent.course?.code || a.sitting.examComponent.code,
      componentName: a.sitting.examComponent.name,
      dayNumber: a.sitting.dayNumber,
      sessionType: a.sitting.sessionType,
      startTime: a.sitting.startTime,
      mySeatLabel: a.seat!.label,
      mySeatId: a.seat!.id,
      layout: a.seat!.classroom.layout as LayoutData | null,
      seats: a.seat!.classroom.seats.map((s) => ({
        id: s.id,
        row: s.row,
        col: s.col,
        label: s.label,
      })),
    }))

  const hasAnySeating = classSeatInfos.length > 0 || examSeatInfos.length > 0

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-blue-800 sm:text-4xl dark:text-white">
          My Seating
        </h1>
          <p className="mt-1 text-base font-medium text-slate-600 dark:text-slate-300">
          View your assigned seats in classes and exams.
        </p>
      </div>

      {!hasAnySeating && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
          <Armchair className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Seating Assignments
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            You don't have any seating assignments yet. Check back when your classes or exams are scheduled.
          </p>
        </div>
      )}

      {/* Class Seats */}
      {classSeatInfos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-black tracking-widest text-slate-500 uppercase">
            Class Seating
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {classSeatInfos.map((info) => (
              <SeatCard
                key={info.classId}
                title={info.courseCode}
                subtitle={`${info.className} | ${info.roomName}`}
                icon={<BookOpen className="h-5 w-5" />}
                mySeatLabel={info.mySeatLabel}
                mySeatId={info.mySeatId}
                layout={info.layout}
                seats={info.seats}
              />
            ))}
          </div>
        </div>
      )}

      {/* Exam Seats */}
      {examSeatInfos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-black tracking-widest text-slate-500 uppercase">
            Exam Seating
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {examSeatInfos.map((info, idx) => (
              <SeatCard
                key={idx}
                title={`${info.componentCode} — ${info.componentName}`}
                subtitle={`${info.eventName} | Day ${info.dayNumber} ${info.sessionType} | ${format(new Date(info.startTime), 'MMM d, yyyy')}`}
                icon={<Calendar className="h-5 w-5" />}
                mySeatLabel={info.mySeatLabel}
                mySeatId={info.mySeatId}
                layout={info.layout!}
                seats={info.seats}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SeatCard({
  title,
  subtitle,
  icon,
  mySeatLabel,
  mySeatId,
  layout,
  seats,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  mySeatLabel: string | null
  mySeatId: string | null
  layout: LayoutData
  seats: { id: string; row: number; col: number; label: string | null }[]
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {mySeatLabel ? (
          <div className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 dark:bg-indigo-900/30">
            <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">
              Seat {mySeatLabel}
            </span>
          </div>
        ) : (
          <span className="text-xs font-bold text-slate-600">Not assigned</span>
        )}
      </div>

      {/* Mini floor plan */}
      <div className="p-4">
        <div className="flex justify-center">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: layout.rows }, (_, r) =>
              Array.from({ length: layout.cols }, (_, c) => {
                const cell = layout.cells.find(
                  (cell) => cell.row === r && cell.col === c
                )
                const type = cell?.type ?? 'AISLE'

                if (type !== 'DESK') {
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={cn(
                        'h-7 w-7 rounded',
                        type === 'OBSTACLE'
                          ? 'bg-red-50 dark:bg-red-900/10'
                          : ''
                      )}
                    >
                      {type === 'OBSTACLE' && (
                        <div className="flex h-full items-center justify-center">
                          <Ban className="h-2.5 w-2.5 text-red-200" />
                        </div>
                      )}
                    </div>
                  )
                }

                const seat = seats.find((s) => s.row === r && s.col === c)
                const isMyDest = seat?.id === mySeatId

                return (
                  <div
                    key={`${r}-${c}`}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded text-[8px] font-bold transition-all',
                      isMyDest
                        ? 'bg-blue-800 text-white ring-2 ring-sky-400 ring-offset-1 dark:bg-indigo-600'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    )}
                    title={seat?.label ? `Seat ${seat.label}` : undefined}
                  >
                    {seat?.label}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
