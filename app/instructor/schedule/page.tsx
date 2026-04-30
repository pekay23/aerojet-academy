import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import CalendarGrid from './_components/CalendarGrid'
import { subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns'

export const metadata: Metadata = { title: 'Teaching Schedule | Instructor Portal' }

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
    // Classes this instructor teaches
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

    // Exam sittings where this instructor is the examiner
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

    // Admin events visible to all or instructors
    prisma.adminCalendarEvent.findMany({
      where: { deletedAt: null, visibleTo: { in: ['ALL', 'INSTRUCTORS'] } },
      orderBy: { startDate: 'asc' },
    }),
  ])

  const schedule = [
    ...(classes as any[]).map((cls: any) => ({
      id: `class-${cls.id}`,
      title: cls.name,
      description: `${cls.course.code} — ${cls.course.name}`,
      startDate: cls.startDate.toISOString(),
      endDate: cls.endDate.toISOString(),
      source: 'class' as const,
      course: cls.course,
      recurrenceType: cls.recurrenceType,
      recurrenceDays: cls.recurrenceDays,
      recurrenceUntil: cls.recurrenceUntil?.toISOString() || null,
    })),
    ...(examSittings as any[]).map((s: any) => ({
      id: `sitting-${s.id}`,
      title: `Exam: ${s.examComponent?.code || 'Module'}`,
      description: `${s.event?.name || ''} — ${s.sessionType} session`,
      startDate: s.startTime.toISOString(),
      endDate: s.endTime.toISOString(),
      source: 'exam' as const,
      course: { id: '', code: 'EXAM', name: s.examComponent?.name || '', category: null },
      recurrenceType: 'NONE',
      recurrenceDays: null,
      recurrenceUntil: null,
    })),
    ...(adminEvents as any[]).map((evt: any) => ({
      id: `admin-${evt.id}`,
      title: evt.title,
      description: evt.description,
      startDate: evt.startDate.toISOString(),
      endDate: evt.endDate?.toISOString() || null,
      source: 'admin' as const,
      course: { id: '', code: 'INFO', name: evt.title, category: null },
      recurrenceType: evt.recurrenceType,
      recurrenceDays: evt.recurrenceDays,
      recurrenceUntil: evt.recurrenceUntil?.toISOString() || null,
    })),
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">
      <CalendarGrid schedule={schedule} initialDate={currentDate} />
    </div>
  )
}
