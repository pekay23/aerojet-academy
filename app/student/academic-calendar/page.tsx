import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getStudentStatus } from '@/lib/access-control'
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react'
import AcademicCalendar, { type UnifiedCalendarEvent } from '@/components/calendar/AcademicCalendar'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../actions'

export default async function StudentAcademicCalendarPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const { enrollmentType: resolvedEnrollmentType } = await getStudentStatus(userId)

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
    prisma.studentCalendarEvent.findMany({ where: { userId }, orderBy: { startDate: 'asc' } }),
    prisma.examBooking.findMany({ where: { userId, deletedAt: null } }),
    prismaUnfiltered.semester.findMany({ where: { isActive: true }, orderBy: { startDate: 'asc' } }),
    prisma.enrollment.findMany({
      where: { userId, status: { in: ['ACTIVE', 'APPROVED', 'ENROLLED'] } },
      include: { course: { include: { classes: true } } },
    }),
    prismaUnfiltered.adminCalendarEvent.findMany({
      where: {
        deletedAt: null,
        OR: [
          { visibleTo: { in: ['ALL', 'STUDENTS', 'EXAM_ONLY', 'MODULAR', 'FULL_TIME'] } },
          { visibleTo: 'SPECIFIC_USER', targetUserId: userId },
        ]
      },
    }),
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
    prisma.tuitionRun.findMany({ where: { status: { in: ['OPEN', 'SCHEDULED'] } } }),
    prismaUnfiltered.examEvent.findMany({ where: { deletedAt: null } }),
    prismaUnfiltered.examPool.findMany({}),
  ])

  const enrollmentType = resolvedEnrollmentType || 'UNKNOWN';
  const events: UnifiedCalendarEvent[] = [];

  // Personal
  personalEvents.forEach((evt: any) => {
    events.push({
      id: evt.id, dbId: evt.id, title: evt.title, description: evt.description,
      startDate: evt.startDate.toISOString(), endDate: evt.endDate?.toISOString() || null,
      color: evt.color || '#f59e0b', source: 'personal', editable: true, visibleTo: 'PRIVATE'
    })
  });

  // Exams
  examBookings.forEach((exam) => {
    if (exam.examDate) {
      events.push({
        id: `exam-${exam.id}`, dbId: exam.id, title: `Exam: ${exam.moduleCode || 'Module'}`,
        description: `Status: ${exam.status}`, startDate: exam.examDate.toISOString(),
        endDate: null, color: '#FF4F33', source: 'exam', editable: false, visibleTo: 'STUDENT'
      })
    }
  });

  // Classes
  enrollments.forEach((enrollment: any) => {
    enrollment.course?.classes?.forEach((cls: any) => {
      if (cls.startDate) {
        events.push({
          id: `class-${cls.id}`, dbId: cls.id, title: cls.name || `Class: ${enrollment.course.code}`,
          startDate: cls.startDate.toISOString(), endDate: cls.endDate?.toISOString() || null,
          color: '#4A72E8', source: 'class', editable: false, visibleTo: 'STUDENT',
          recurrenceType: cls.recurrenceType, recurrenceDays: cls.recurrenceDays,
          recurrenceUntil: cls.recurrenceUntil?.toISOString() || null,
        })
      }
    })
  });

  // Admin Broadcasts
  adminEvents.forEach((evt: any) => {
    if (evt.visibleTo === 'EXAM_ONLY' && enrollmentType !== 'EXAM_ONLY') return;
    if (evt.visibleTo === 'MODULAR' && enrollmentType !== 'MODULAR') return;
    if (evt.visibleTo === 'FULL_TIME' && enrollmentType !== 'FULL_TIME') return;
    events.push({
      id: `admin-${evt.id}`, dbId: evt.id, title: evt.title, description: evt.description,
      startDate: evt.startDate.toISOString(), endDate: evt.endDate?.toISOString() || null,
      color: evt.color || '#8b5cf6', source: 'admin', editable: false, visibleTo: 'ALL'
    })
  });

  // Sitting Assignments
  sittingAssignments.forEach((assignment: any) => {
    const sitting = assignment.sitting
    if (sitting?.startTime) {
      events.push({
        id: `sitting-${assignment.id}`, dbId: assignment.id,
        title: `Exam Sitting: ${sitting.examComponent?.code || 'Module'}`,
        description: `${sitting.event?.name} — ${sitting.sessionType} session`,
        startDate: sitting.startTime.toISOString(), endDate: sitting.endTime?.toISOString() || null,
        color: '#FF4F33', source: 'exam', editable: false, visibleTo: 'STUDENT'
      })
    }
  });

  async function handleSave(data: any, editingId?: string) {
    'use server'
    return editingId 
      ? updateCalendarEvent(editingId, data)
      : createCalendarEvent(data)
  }

  async function handleDelete(dbId: string) {
    'use server'
    return deleteCalendarEvent(dbId)
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white uppercase">
          Academic Calendar
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Plan your studies with high-fidelity Week & Month schedules.
        </p>
      </div>

      <AcademicCalendar 
        events={events} 
        currentUserId={userId}
        canCreate={true}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
