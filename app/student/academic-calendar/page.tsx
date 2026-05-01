import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getStudentStatus } from '@/lib/access-control'
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react'
import CalendarGrid, { type CalendarEvent } from './_components/CalendarGrid'

export const metadata: Metadata = {
  title: 'Academic Calendar | Student Portal',
  description: 'View upcoming academic events, class schedules, and exam dates. Manage your personal events.',
}

export default async function StudentAcademicCalendarPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  // getStudentStatus is React.cache'd — no extra DB query if layout already resolved it
  const { enrollmentType: resolvedEnrollmentType } = await getStudentStatus(userId)

  // Fetch all data sources in parallel.
  const [
    personalEvents,
    examBookings,
    semesters,
    enrollments,
    adminEvents,
    sittingAssignments,
    tuitionRuns,
    examEvents,
    examPools,
  ] = await Promise.all([
    // 1. Student's personal calendar events
    prisma.studentCalendarEvent.findMany({
      where: { userId },
      orderBy: { startDate: 'asc' },
    }),

    // 2. Exam bookings for the student
    prisma.examBooking.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        moduleCode: true,
        examDate: true,
        examCategory: true,
        status: true,
      },
    }),

    // 3. Active semesters
    prismaUnfiltered.semester.findMany({
      where: { isActive: true },
      orderBy: { startDate: 'asc' },
      select: { id: true, name: true, startDate: true, endDate: true },
    }),

    // 4. Student's class schedules via enrollments
    prisma.enrollment.findMany({
      where: { userId, status: { in: ['ACTIVE', 'APPROVED', 'ENROLLED'] } },
      include: {
        course: {
          include: {
            classes: {
              select: { id: true, name: true, startDate: true, endDate: true, schedule: true, recurrenceType: true, recurrenceDays: true, recurrenceUntil: true },
            },
          },
        },
      },
    }),

    // 5. Admin events
    prismaUnfiltered.adminCalendarEvent.findMany({
      where: {
        deletedAt: null,
        OR: [
          { visibleTo: { in: ['ALL', 'STUDENTS', 'EXAM_ONLY', 'MODULAR', 'FULL_TIME'] } },
          { visibleTo: 'SPECIFIC_USER', targetUserId: userId },
        ]
      },
      orderBy: { startDate: 'asc' },
    }),

    // 6. ExamSitting assignments for this student
    prisma.examSittingAssignment.findMany({
      where: { userId, status: { not: 'CANCELLED' } },
      include: {
        sitting: {
          include: {
            event: { select: { name: true } },
            examComponent: { select: { code: true, name: true } },
          },
        },
      },
    }),

    // 7. Revision runs
    prisma.tuitionRun.findMany({
      where: { status: { in: ['OPEN', 'SCHEDULED'] } },
    }),

    // 8. Pool Deadlines & Event dates
    prismaUnfiltered.examEvent.findMany({
      where: { deletedAt: null },
    }),

    // 9. Exam Pools
    prismaUnfiltered.examPool.findMany({}),
  ])

  const enrollmentType = resolvedEnrollmentType || 'UNKNOWN';

  // Merge all events into a unified CalendarEvent[] format
  const calendarEvents: CalendarEvent[] = [];

  // Personal events (editable)
  (personalEvents as any[]).forEach((evt: any) => {
    calendarEvents.push({
      id: evt.id,
      title: evt.title,
      description: evt.description,
      startDate: evt.startDate.toISOString(),
      endDate: evt.endDate?.toISOString() || null,
      color: evt.color,
      recurrenceType: evt.recurrenceType,
      recurrenceDays: evt.recurrenceDays,
      recurrenceUntil: evt.recurrenceUntil?.toISOString() || null,
      source: 'personal',
      editable: !evt.isSystemEvent,
      isSystemEvent: evt.isSystemEvent,
    })
  });

  // Exam bookings (read-only)
  examBookings.forEach((exam) => {
    if (exam.examDate) {
      calendarEvents.push({
        id: `exam-${exam.id}`,
        title: `Exam: ${exam.moduleCode || 'Module'} (${exam.examCategory === 'OFFICIAL_EASA' ? 'EASA' : 'Internal'})`,
        description: `Status: ${exam.status}`,
        startDate: exam.examDate.toISOString(),
        endDate: null,
        color: '#e11d48',
        source: 'exam',
        editable: false,
      })
    }
  });

  // Semesters (read-only)
  semesters.forEach((sem) => {
    calendarEvents.push({
      id: `sem-start-${sem.id}`,
      title: `${sem.name} — Starts`,
      description: `Academic semester begins`,
      startDate: sem.startDate.toISOString(),
      endDate: null,
      color: '#10b981',
      source: 'semester',
      editable: false,
    })
    calendarEvents.push({
      id: `sem-end-${sem.id}`,
      title: `${sem.name} — Ends`,
      description: `Academic semester concludes`,
      startDate: sem.endDate.toISOString(),
      endDate: null,
      color: '#10b981',
      source: 'semester',
      editable: false,
    });
  });

  // Class schedules (read-only)
  ;(enrollments as any[]).forEach((enrollment: any) => {
    enrollment.course?.classes?.forEach((cls: any) => {
      if (cls.startDate) {
        calendarEvents.push({
          id: `class-${cls.id}`,
          title: cls.name || `Class: ${enrollment.course.code}`,
          description: cls.schedule ? (typeof cls.schedule === 'string' ? cls.schedule : JSON.stringify(cls.schedule)) : undefined,
          startDate: new Date(cls.startDate).toISOString(),
          endDate: cls.endDate ? new Date(cls.endDate).toISOString() : null,
          color: '#6366f1',
          source: 'class',
          editable: false,
          recurrenceType: cls.recurrenceType,
          recurrenceDays: cls.recurrenceDays,
          recurrenceUntil: cls.recurrenceUntil ? new Date(cls.recurrenceUntil).toISOString() : null,
        })
      }
    })
  })

  // Admin-created events visible to students (read-only)
  ;(adminEvents as any[]).forEach((evt: any) => {
    if (evt.visibleTo === 'EXAM_ONLY' && enrollmentType !== 'EXAM_ONLY') return;
    if (evt.visibleTo === 'MODULAR' && enrollmentType !== 'MODULAR') return;
    if (evt.visibleTo === 'FULL_TIME' && enrollmentType !== 'FULL_TIME') return;
    if (evt.visibleTo === 'SPECIFIC_USER' && evt.targetUserId !== userId) return;

    calendarEvents.push({
      id: `admin-${evt.id}`,
      title: evt.title,
      description: evt.description,
      startDate: evt.startDate.toISOString(),
      endDate: evt.endDate?.toISOString() || null,
      color: evt.color || '#8b5cf6',
      source: 'semester',
      editable: false,
      recurrenceType: evt.recurrenceType,
      recurrenceDays: evt.recurrenceDays,
      recurrenceUntil: evt.recurrenceUntil?.toISOString() || null,
      isSystemEvent: true,
    })
  })

  // Exam sitting assignments for this student (read-only)
  ;(sittingAssignments as any[]).forEach((assignment: any) => {
    const sitting = assignment.sitting
    if (sitting?.startTime) {
      calendarEvents.push({
        id: `sitting-${assignment.id}`,
        title: `Exam Sitting: ${sitting.examComponent?.code || 'Module'}`,
        description: `${sitting.event?.name || ''} — ${sitting.sessionType || ''} session`,
        startDate: sitting.startTime.toISOString(),
        endDate: sitting.endTime?.toISOString() || null,
        color: '#e11d48',
        source: 'exam',
        editable: false,
      })
    }
  })

  // 7. Revision sessions (TuitionRuns)
  ;(tuitionRuns as any[]).forEach((run: any) => {
    calendarEvents.push({
      id: `revision-${run.id}`,
      title: `Revision: ${run.title}`,
      description: run.description || 'Module revision and study support session.',
      startDate: run.startDatetime.toISOString(),
      endDate: run.endDatetime?.toISOString() || null,
      color: '#3b82f6',
      source: 'class',
      editable: false,
    })
  })

  // 8. ExamEvent deadlines
  ;(examEvents as any[]).forEach((evt: any) => {
    if (evt.joinDeadline) {
      calendarEvents.push({
        id: `event-join-${evt.id}`,
        title: `Exam Pool Deadline: ${evt.name}`,
        description: `Join or apply deadline for this exam event.`,
        startDate: evt.joinDeadline.toISOString(),
        endDate: null,
        color: '#f59e0b',
        source: 'exam',
        editable: false,
      })
    }

    if (evt.paymentDeadline) {
      calendarEvents.push({
        id: `event-pay-${evt.id}`,
        title: `Exam Payment Deadline: ${evt.name}`,
        description: `Final day to clear payment for bookings.`,
        startDate: evt.paymentDeadline.toISOString(),
        endDate: null,
        color: '#ef4444',
        source: 'exam',
        editable: false,
      })
    }
  })

  // 9. ExamPool dates
  ;(examPools as any[]).forEach((pool: any) => {
    if (pool.examDate) {
      calendarEvents.push({
        id: `pool-${pool.id}`,
        title: `Pool Exam Day: ${pool.name}`,
        description: `Scheduled exam date for this pool`,
        startDate: pool.examStartTime.toISOString(),
        endDate: pool.examEndTime?.toISOString() || null,
        color: '#8b5cf6',
        source: 'exam',
        editable: false,
      })
    }
  })

  // Sort all events by date
  calendarEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
              <CalendarIcon className="h-6 w-6" />
            </div>
            Academic Calendar
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-aerojet-sky" />
            Your classes, exams, semesters, and personal events in one place.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-bold dark:bg-slate-800">
            {calendarEvents.length} event{calendarEvents.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Interactive Calendar */}
      <CalendarGrid events={calendarEvents} userId={userId} />
    </div>
  )
}
