import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma, { prismaUnfiltered } from '@/lib/prisma/client'
import { subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import AcademicCalendar, { type UnifiedCalendarEvent } from '@/components/calendar/AcademicCalendar'

export const metadata: Metadata = { title: 'Invigilation Schedule | Examiner Portal' }

export default async function ExaminerSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'EXAMINER') redirect('/login')

  const { month } = await searchParams
  const currentDate = month ? new Date(month) : new Date()
  const rangeStart = subMonths(startOfMonth(currentDate), 1)
  const rangeEnd = addMonths(endOfMonth(currentDate), 1)

  const [sittings, adminEvents] = await Promise.all([
    // Examiner's assigned sittings
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

    // Admin events visible to examiners (ALL or specific ones)
    prisma.adminCalendarEvent.findMany({
      where: { deletedAt: null, visibleTo: { in: ['ALL', 'INSTRUCTORS'] } }, // Examiners usually follow instructor visibility
      orderBy: { startDate: 'asc' },
    }),
  ])

  const events: UnifiedCalendarEvent[] = [
    ...(sittings as any[]).map((s: any) => ({
      id: `sitting-${s.id}`, dbId: s.id, title: `Invigilation: ${s.examComponent?.code || 'Module'}`,
      description: `${s.event?.name} — ${s.sessionType} session`,
      startDate: s.startTime.toISOString(), endDate: s.endTime?.toISOString() || null,
      color: '#FF4F33', source: 'exam' as const, editable: false, visibleTo: 'EXAMINER'
    })),
    ...(adminEvents as any[]).map((evt: any) => ({
      id: `admin-${evt.id}`, dbId: evt.id, title: evt.title, description: evt.description,
      startDate: evt.startDate.toISOString(), endDate: evt.endDate?.toISOString() || null,
      color: evt.color || '#8b5cf6', source: 'admin' as const, editable: false, visibleTo: 'ALL'
    })),
  ]

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white uppercase">
          Invigilation Schedule
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your exam sittings and logistical timeline.
        </p>
      </div>

      <AcademicCalendar 
        events={events} 
        currentUserId={session.user.id}
        canCreate={false}
      />
    </div>
  )
}
