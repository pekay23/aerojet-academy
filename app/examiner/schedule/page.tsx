import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import AcademicCalendar, { type UnifiedCalendarEvent } from '@/components/calendar/AcademicCalendar'

export const metadata: Metadata = { title: 'Invigilation Schedule | Examiner Portal' }

export default async function ExaminerSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'EXAMINER') return await redirectToLogin()

  const { month } = await searchParams
  const currentDate = month ? new Date(month) : new Date()
  const rangeStart = subMonths(startOfMonth(currentDate), 1)
  const rangeEnd = addMonths(endOfMonth(currentDate), 1)

  const [sittings, adminEvents] = await Promise.all([
    // Examiner's assigned sittings
    prismaUnfiltered.examSitting.findMany({
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

    // Admin events visible to examiners (ALL or EXAM_ONLY)
    prismaUnfiltered.adminCalendarEvent.findMany({
      where: { deletedAt: null, visibleTo: { in: ['ALL', 'INSTRUCTORS', 'EXAM_ONLY'] } }, // Examiners usually follow instructor visibility
      orderBy: { startDate: 'asc' },
    }),
  ])

  type SittingRow = {
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
    ...(sittings as SittingRow[]).map((s) => ({
      id: `sitting-${s.id}`,
      dbId: s.id,
      title: `Invigilation: ${s.examComponent?.code || 'Module'}`,
      description: `${s.event?.name} — ${s.sessionType} session`,
      startDate: s.startTime.toISOString(),
      endDate: s.endTime?.toISOString() || null,
      color: '#FF4F33',
      source: 'exam' as const,
      editable: false,
      visibleTo: 'EXAMINER',
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
          Invigilation Schedule
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage your exam sittings and logistical timeline.
        </p>
      </div>

      <AcademicCalendar events={events} currentUserId={session.user.id} canCreate={false} />
    </div>
  )
}
