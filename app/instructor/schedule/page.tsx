import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'

import { subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns'

export const metadata: Metadata = { title: 'Teaching Schedule | Instructor Portal' }
export const dynamic = 'force-dynamic'

import AcademicCalendar, { type UnifiedCalendarEvent } from '@/components/calendar/AcademicCalendar'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') redirect('/login')

  const { month } = await searchParams
  const currentDate = month ? new Date(month) : new Date()
  const rangeStart = subMonths(startOfMonth(currentDate), 1)
  const rangeEnd = addMonths(endOfMonth(currentDate), 1)

  const instructorProfile = await prisma.instructorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  const [classes, examSittings, adminEvents] = await Promise.all([
    instructorProfile
      ? prisma.class.findMany({
          where: {
            instructorId: instructorProfile.id,
            startDate: { lte: rangeEnd },
            endDate: { gte: rangeStart },
          },
          include: { course: { select: { id: true, code: true, name: true, category: true } } },
          orderBy: { startDate: 'asc' },
        })
      : [],
    prisma.examSitting.findMany({
      where: {
        examiner: { userId: session.user.id },
        startTime: { gte: rangeStart, lte: rangeEnd },
      },
      include: {
        event: { select: { name: true } },
        examComponent: { select: { code: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    }),
    prisma.adminCalendarEvent.findMany({
      where: { deletedAt: null, visibleTo: { in: ['ALL', 'INSTRUCTORS'] } },
      orderBy: { startDate: 'asc' },
    }),
  ])

  type ClassWithCourse = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM' | null
  recurrenceDays: string | null
  recurrenceUntil: Date | null
  course: { id: string; code: string; name: string; category: string | null }
}

type ExamSittingWithRefs = {
  id: string
  startTime: Date
  endTime: Date | null
  sessionType: string | null
  event: { name: string } | null
  examComponent: { code: string; name: string } | null
}

type AdminEventRow = {
  id: string
  title: string
  description: string | null
  startDate: Date
  endDate: Date | null
  color: string | null
}

  const events: UnifiedCalendarEvent[] = [
    ...(classes as ClassWithCourse[]).map((cls) => ({
      id: `class-${cls.id}`,
      dbId: cls.id,
      title: cls.name,
      description: `${cls.course.code} — ${cls.course.name}`,
      startDate: cls.startDate.toISOString(),
      endDate: cls.endDate.toISOString(),
      color: '#4A72E8',
      source: 'class' as const,
      editable: false,
      visibleTo: 'INSTRUCTOR',
      recurrenceType: cls.recurrenceType,
      recurrenceDays: cls.recurrenceDays,
      recurrenceUntil: cls.recurrenceUntil?.toISOString() || null,
    })),
    ...(examSittings as ExamSittingWithRefs[]).map((s) => ({
      id: `sitting-${s.id}`,
      dbId: s.id,
      title: `Exam: ${s.examComponent?.code || 'Module'}`,
      description: `${s.event?.name} — ${s.sessionType} session`,
      startDate: s.startTime.toISOString(),
      endDate: s.endTime?.toISOString() || null,
      color: '#FF4F33',
      source: 'exam' as const,
      editable: false,
      visibleTo: 'INSTRUCTOR',
    })),
    ...(adminEvents as AdminEventRow[]).map((evt) => ({
      id: `admin-${evt.id}`,
      dbId: evt.id,
      title: evt.title,
      description: evt.description,
      startDate: evt.startDate.toISOString(),
      endDate: evt.endDate?.toISOString() || null,
      color: evt.color || '#8b5cf6',
      source: 'admin' as const,
      editable: false,
      visibleTo: 'ALL',
    })),
  ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-350 space-y-8 duration-700">
      <div>
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight uppercase dark:text-white">
          Teaching Schedule
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Your assigned classes and invigilation blocks.
        </p>
      </div>

      <AcademicCalendar events={events} currentUserId={session.user.id} canCreate={false} />
    </div>
  )
}
