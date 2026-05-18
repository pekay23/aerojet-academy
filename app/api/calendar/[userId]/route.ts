import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getStudentStatus } from '@/lib/access-control'
import { getAuthSession } from '@/lib/auth/helpers'
import { addHours } from 'date-fns'

function escapeString(str: string | null | undefined) {
  if (!str) return ''
  return str.replace(/[\\;,]/g, (match) => `\\${match}`).replace(/\n/g, '\\n')
}

function formatDateToiCal(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  if (!userId) {
    return new NextResponse('User ID required', { status: 400 })
  }

  // Auth check: only the user themselves or staff can access this calendar
  const session = await getAuthSession()
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const staffRoles = ['ADMIN', 'SUPER_ADMIN', 'STAFF']
  if (session.user.id !== userId && !staffRoles.includes(session.user.role)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
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
      prismaUnfiltered.studentCalendarEvent.findMany({
        where: { userId },
        orderBy: { startDate: 'asc' },
      }),
      prismaUnfiltered.examBooking.findMany({
        where: { userId, deletedAt: null },
        select: {
          id: true,
          moduleCode: true,
          examDate: true,
          examCategory: true,
          status: true,
        },
      }),
      prismaUnfiltered.semester.findMany({
        where: { isActive: true },
        orderBy: { startDate: 'asc' },
        select: { id: true, name: true, startDate: true, endDate: true },
      }),
      prismaUnfiltered.enrollment.findMany({
        where: { userId, status: { in: ['ACTIVE', 'APPROVED', 'ENROLLED'] } },
        include: {
          course: {
            include: {
              classes: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                  schedule: true,
                  recurrenceType: true,
                  recurrenceDays: true,
                  recurrenceUntil: true,
                },
              },
            },
          },
        },
      }),
      prismaUnfiltered.adminCalendarEvent.findMany({
        where: {
          deletedAt: null,
          OR: [
            { visibleTo: { in: ['ALL', 'STUDENTS', 'EXAM_ONLY', 'MODULAR', 'FULL_TIME'] } },
            { visibleTo: 'SPECIFIC_USER', targetUserId: userId },
          ],
        },
        orderBy: { startDate: 'asc' },
      }),
      prismaUnfiltered.examSittingAssignment.findMany({
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
      prismaUnfiltered.tuitionRun.findMany({
        where: { status: { in: ['OPEN', 'SCHEDULED'] } },
      }),
      prismaUnfiltered.examEvent.findMany({
        where: { deletedAt: null, endDate: { gte: new Date() } },
        select: { id: true, name: true, joinDeadline: true, paymentDeadline: true },
      }),
      prismaUnfiltered.examPool.findMany({
        where: {
          memberships: { some: { userId } },
        },
        select: { id: true, name: true, examStartTime: true, examEndTime: true },
      }),
    ])

    const enrollmentType = resolvedEnrollmentType || 'UNKNOWN'
    const icsEvents: string[] = []

    // 1. Personal events
    personalEvents.forEach((evt) => {
      const start = evt.startDate
      const end = evt.endDate || addHours(start, 1)
      icsEvents.push(`BEGIN:VEVENT
UID:personal-${evt.id}@aerojet-academy.com
DTSTAMP:${formatDateToiCal(new Date())}
DTSTART:${formatDateToiCal(start)}
DTEND:${formatDateToiCal(end)}
SUMMARY:${escapeString(evt.title)}
DESCRIPTION:${escapeString(evt.description || 'Personal event')}
END:VEVENT`)
    })

    // 2. Exam bookings
    examBookings.forEach((exam) => {
      if (exam.examDate) {
        const start = exam.examDate
        const end = addHours(start, 2)
        icsEvents.push(`BEGIN:VEVENT
UID:exam-${exam.id}@aerojet-academy.com
DTSTAMP:${formatDateToiCal(new Date())}
DTSTART:${formatDateToiCal(start)}
DTEND:${formatDateToiCal(end)}
SUMMARY:Exam: ${escapeString(exam.moduleCode || 'Module')} (${exam.examCategory === 'OFFICIAL_EASA' ? 'EASA' : 'Internal'})
DESCRIPTION:Status: ${escapeString(exam.status)}
END:VEVENT`)
      }
    })

    // 3. Semesters
    semesters.forEach((sem) => {
      if (sem.startDate) {
        icsEvents.push(`BEGIN:VEVENT
UID:sem-start-${sem.id}@aerojet-academy.com
DTSTAMP:${formatDateToiCal(new Date())}
DTSTART:${formatDateToiCal(sem.startDate)}
DTEND:${formatDateToiCal(addHours(sem.startDate, 1))}
SUMMARY:${escapeString(sem.name)} — Starts
DESCRIPTION:Academic semester begins
END:VEVENT`)
      }
      if (sem.endDate) {
        icsEvents.push(`BEGIN:VEVENT
UID:sem-end-${sem.id}@aerojet-academy.com
DTSTAMP:${formatDateToiCal(new Date())}
DTSTART:${formatDateToiCal(sem.endDate)}
DTEND:${formatDateToiCal(addHours(sem.endDate, 1))}
SUMMARY:${escapeString(sem.name)} — Ends
DESCRIPTION:Academic semester concludes
END:VEVENT`)
      }
    })

    // 4. Class schedules via enrollments
    enrollments.forEach((enrollment: any) => {
      enrollment.course?.classes?.forEach((cls: any) => {
        if (cls.startDate) {
          const start = new Date(cls.startDate)
          const end = cls.endDate ? new Date(cls.endDate) : addHours(start, 2)
          icsEvents.push(`BEGIN:VEVENT
UID:class-${cls.id}@aerojet-academy.com
DTSTAMP:${formatDateToiCal(new Date())}
DTSTART:${formatDateToiCal(start)}
DTEND:${formatDateToiCal(end)}
SUMMARY:${escapeString(cls.name || `Class: ${enrollment.course.code}`)}
DESCRIPTION:Course Class Schedule
END:VEVENT`)
        }
      })
    })

    // 5. Admin events
    adminEvents.forEach((evt: any) => {
      if (evt.visibleTo === 'EXAM_ONLY' && enrollmentType !== 'EXAM_ONLY') return
      if (evt.visibleTo === 'MODULAR' && enrollmentType !== 'MODULAR') return
      if (evt.visibleTo === 'FULL_TIME' && enrollmentType !== 'FULL_TIME') return
      if (evt.visibleTo === 'SPECIFIC_USER' && evt.targetUserId !== userId) return

      const start = evt.startDate
      const end = evt.endDate || addHours(start, 1)
      icsEvents.push(`BEGIN:VEVENT
UID:admin-${evt.id}@aerojet-academy.com
DTSTAMP:${formatDateToiCal(new Date())}
DTSTART:${formatDateToiCal(start)}
DTEND:${formatDateToiCal(end)}
SUMMARY:${escapeString(evt.title)}
DESCRIPTION:${escapeString(evt.description || 'Academy Event')}
END:VEVENT`)
    })

    // 6. Exam sitting assignments
    sittingAssignments.forEach((assignment: any) => {
      const sitting = assignment.sitting
      if (sitting?.startTime) {
        const start = sitting.startTime
        const end = sitting.endTime || addHours(start, 2)
        icsEvents.push(`BEGIN:VEVENT
UID:sitting-${assignment.id}@aerojet-academy.com
DTSTAMP:${formatDateToiCal(new Date())}
DTSTART:${formatDateToiCal(start)}
DTEND:${formatDateToiCal(end)}
SUMMARY:Exam Sitting: ${escapeString(sitting.examComponent?.code || 'Module')}
DESCRIPTION:${escapeString(sitting.event?.name || '')} — ${escapeString(sitting.sessionType || '')} session
END:VEVENT`)
      }
    })

    // 7. Tuition runs
    tuitionRuns.forEach((run: any) => {
      if (run.startDatetime) {
        const start = run.startDatetime
        const end = run.endDatetime || addHours(start, 2)
        icsEvents.push(`BEGIN:VEVENT
UID:revision-${run.id}@aerojet-academy.com
DTSTAMP:${formatDateToiCal(new Date())}
DTSTART:${formatDateToiCal(start)}
DTEND:${formatDateToiCal(end)}
SUMMARY:Revision: ${escapeString(run.title)}
DESCRIPTION:${escapeString(run.description || 'Module revision and study support session.')}
END:VEVENT`)
      }
    })

    // 8. Exam Event deadlines
    examEvents.forEach((evt: any) => {
      if (evt.joinDeadline) {
        const start = evt.joinDeadline
        icsEvents.push(`BEGIN:VEVENT
UID:event-join-${evt.id}@aerojet-academy.com
DTSTAMP:${formatDateToiCal(new Date())}
DTSTART:${formatDateToiCal(start)}
DTEND:${formatDateToiCal(addHours(start, 1))}
SUMMARY:Exam Pool Deadline: ${escapeString(evt.name)}
DESCRIPTION:Join or apply deadline for this exam event
END:VEVENT`)
      }

      if (evt.paymentDeadline) {
        const start = evt.paymentDeadline
        icsEvents.push(`BEGIN:VEVENT
UID:event-pay-${evt.id}@aerojet-academy.com
DTSTAMP:${formatDateToiCal(new Date())}
DTSTART:${formatDateToiCal(start)}
DTEND:${formatDateToiCal(addHours(start, 1))}
SUMMARY:Exam Payment Deadline: ${escapeString(evt.name)}
DESCRIPTION:Final day to clear payment for bookings
END:VEVENT`)
      }
    })

    // 9. Exam pools
    examPools.forEach((pool: any) => {
      if (pool.examStartTime) {
        const start = pool.examStartTime
        const end = pool.examEndTime || addHours(start, 2)
        icsEvents.push(`BEGIN:VEVENT
UID:pool-${pool.id}@aerojet-academy.com
DTSTAMP:${formatDateToiCal(new Date())}
DTSTART:${formatDateToiCal(start)}
DTEND:${formatDateToiCal(end)}
SUMMARY:Pool Exam Day: ${escapeString(pool.name)}
DESCRIPTION:Scheduled exam date for this pool
END:VEVENT`)
      }
    })

    const iCalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Aerojet Academy//Academic Calendar//EN',
      'CALSCALE:GREGORIAN',
      ...icsEvents,
      'END:VCALENDAR',
    ].join('\r\n')

    return new NextResponse(iCalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="aerojet-calendar.ics"',
      },
    })
  } catch (error) {
    console.error('Failed to generate iCal feed:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
