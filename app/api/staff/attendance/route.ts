import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AttendanceStatus } from '@prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'

const STATUSES = Object.values(AttendanceStatus) as [AttendanceStatus, ...AttendanceStatus[]]

const batchSchema = z.object({
  classId: z.string(),
  date: z.string(),
  records: z.array(
    z.object({
      userId: z.string(),
      status: z.enum(STATUSES),
      minutesLate: z.number().optional(),
      notes: z.string().optional(),
    })
  ),
})

// GET — fetch attendance for a class + date, and the class roster (from course enrollments)
export const GET = withErrorHandler(async (req: NextRequest, _ctx?: RouteContext) => {
  await requireStaff()
  const url = new URL(req.url)
  const classId = url.searchParams.get('classId')
  const date = url.searchParams.get('date')

  if (!classId) return apiError('classId is required')

  const where: Record<string, unknown> = { classId }
  if (date) {
    const d = new Date(date)
    const next = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    where.date = { gte: d, lt: next }
  }

  const records = await prismaUnfiltered.attendanceRecord.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { studentId: true } },
        },
      },
    },
    orderBy: { user: { profile: { firstName: 'asc' } } },
  })

  // Get the class with its courseId to pull enrolled students
  const classData = await prismaUnfiltered.class.findUnique({
    where: { id: classId },
    select: { id: true, name: true, courseId: true },
  })

  // Get course enrollments as class roster
  // Include PENDING enrollments — students may be marked attendance before
  // their enrollment is fully approved, and excluding them silently drops
  // the entire roster when the course has only pending approvals.
  const enrollments = classData
    ? await prismaUnfiltered.enrollment.findMany({
        where: {
          courseId: classData.courseId,
          status: { in: ['ENROLLED', 'ACTIVE', 'APPROVED', 'PENDING'] },
        },
        select: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true } },
              studentProfile: { select: { studentId: true } },
            },
          },
        },
      })
    : []

  // Attendance stats
  const totalRecords = records.length
  const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
  const rate = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0

  return apiSuccess({
    records,
    roster: enrollments.map((e) => e.user),
    className: classData?.name,
    stats: { total: totalRecords, present, rate },
  })
})

// POST — batch submit attendance
export const POST = withErrorHandler(async (req: NextRequest, _ctx?: RouteContext) => {
  const staff = await requireStaff()
  const body = await req.json()
  const parsed = batchSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const { classId, date, records } = parsed.data
  const dateObj = new Date(date)

  // Validate: check total instructional hours for the day (6h max)
  const sessionsToday = await prismaUnfiltered.classSession.findMany({
    where: {
      classId,
      date: {
        gte: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
        lt: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1),
      },
    },
  })

  const totalHoursToday = sessionsToday.reduce((s, sess) => s + sess.instructionalHours, 0)
  if (totalHoursToday > 6) {
    console.warn(
      `[Attendance] Day total ${totalHoursToday}h exceeds 6h limit for class ${classId} on ${date}`
    )
  }

  // Upsert attendance records
  const results = await prismaUnfiltered.$transaction(
    records.map((r) =>
      prismaUnfiltered.attendanceRecord.upsert({
        where: {
          classId_userId_date: {
            classId,
            userId: r.userId,
            date: dateObj,
          },
        },
        update: {
          status: r.status,
          minutesLate: r.minutesLate || null,
          notes: r.notes || null,
          recordedBy: staff.id,
        },
        create: {
          classId,
          userId: r.userId,
          date: dateObj,
          status: r.status,
          minutesLate: r.minutesLate || null,
          notes: r.notes || null,
          recordedBy: staff.id,
        },
      })
    )
  )

  // Audit log
  await createAuditLog({
    userId: staff.id,
    action: AuditAction.UPDATE,
    entity: 'AttendanceRecord',
    description: `Marked attendance for ${results.length} student(s) in class ${classId} on ${date}`,
    changes: {
      classId,
      date,
      recordCount: results.length,
      statuses: records.map((r) => ({ userId: r.userId, status: r.status })),
    },
  })

  return apiSuccess({ saved: results.length })
})
