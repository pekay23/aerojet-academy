import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import prisma, { prismaUnfiltered } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import StaffCalendarGrid from './_components/StaffCalendarGrid'
import { subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns'

export const metadata: Metadata = {
  title: 'Academic Calendar | Staff Portal',
  description: 'Manage and broadcast institutional events, class schedules, and exam dates.',
}

export default async function StaffCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    redirect('/login')
  }

  const { month } = await searchParams
  const currentDate = month ? new Date(month) : new Date()

  const rangeStart = subMonths(startOfMonth(currentDate), 1)
  const rangeEnd = addMonths(endOfMonth(currentDate), 1)

  // Fetch all event types in parallel (using prismaUnfiltered to bypass RLS overhead for Staff)
  const [classes, examEvents, adminEvents] = await Promise.all([
    // Class sessions
    prismaUnfiltered.class.findMany({
      where: {
        startDate: { lte: rangeEnd },
        endDate: { gte: rangeStart },
      },
      include: {
        course: { select: { id: true, code: true, name: true, category: true } },
        instructor: {
          include: {
            user: { select: { profile: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    }),

    // Exam events
    prismaUnfiltered.examEvent.findMany({
      where: {
        deletedAt: null,
        startDate: { lte: rangeEnd },
        endDate: { gte: rangeStart },
      },
      orderBy: { startDate: 'asc' },
    }),

    // Admin-created calendar events
    prismaUnfiltered.adminCalendarEvent.findMany({
      where: {
        deletedAt: null,
        startDate: { lte: rangeEnd },
      },
      include: {
        creator: { select: { profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { startDate: 'asc' },
    }),
  ])

  // Map to unified event format
  const events = [
    ...classes.map((cls: any) => ({
      id: `class-${cls.id}`,
      dbId: cls.id,
      title: `${cls.course.code} — ${cls.name}`,
      description: cls.instructor?.user?.profile
        ? `Instructor: ${cls.instructor.user.profile.firstName} ${cls.instructor.user.profile.lastName}`
        : 'No instructor assigned',
      startDate: cls.startDate.toISOString(),
      endDate: cls.endDate.toISOString(),
      color: '#4A72E8',
      source: 'class' as const,
      editable: false,
      visibleTo: 'ALL' as const,
      recurrenceType: cls.recurrenceType,
      recurrenceDays: cls.recurrenceDays,
      recurrenceUntil: cls.recurrenceUntil?.toISOString() || null,
    })),
    ...examEvents.map((evt: any) => ({
      id: `exam-${evt.id}`,
      dbId: evt.id,
      title: evt.name,
      description: `Status: ${evt.status}`,
      startDate: evt.startDate.toISOString(),
      endDate: evt.endDate.toISOString(),
      color: '#FF4F33',
      source: 'exam' as const,
      editable: false,
      visibleTo: 'ALL' as const,
      recurrenceType: 'NONE',
      recurrenceDays: null,
      recurrenceUntil: null,
    })),
    ...adminEvents.map((evt: any) => ({
      id: `admin-${evt.id}`,
      dbId: evt.id,
      title: evt.title,
      description: evt.description || null,
      startDate: evt.startDate.toISOString(),
      endDate: evt.endDate?.toISOString() || null,
      color: evt.color || '#8b5cf6',
      source: 'admin' as const,
      editable: true,
      visibleTo: evt.visibleTo as 'ALL' | 'STUDENTS' | 'INSTRUCTORS',
      recurrenceType: evt.recurrenceType,
      recurrenceDays: evt.recurrenceDays,
      recurrenceUntil: evt.recurrenceUntil?.toISOString() || null,
    })),
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">
      <StaffCalendarGrid
        events={events}
        initialDate={currentDate}
        currentUserId={session.user.id}
      />
    </div>
  )
}
