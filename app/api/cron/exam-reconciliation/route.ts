import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { getSystemSetting } from '@/lib/settings'
import { sendEmail } from '@/lib/email/sender'
import { env } from '@/lib/env'
import { markExamAttendance } from '@/lib/exams/attendance'
import { getExamNotificationDedupeKey } from '@/lib/exams/fulfillment'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { TIME_WINDOWS } from '@/lib/constants/business-rules'

const DEFAULT_GRACE_HOURS = TIME_WINDOWS.EXAM_CUTOFF_HOURS

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const configuredGraceHours = Number(
      await getSystemSetting('exam_reconciliation_grace_hours', String(DEFAULT_GRACE_HOURS))
    )
    const graceHours =
      Number.isFinite(configuredGraceHours) && configuredGraceHours >= 0
        ? configuredGraceHours
        : DEFAULT_GRACE_HOURS
    const graceMs = graceHours * 60 * 60 * 1000
    const cutoff = new Date(Date.now() - graceMs)

    const results = {
      bookingsProcessed: 0,
      sittingsProcessed: 0,
      emailsSent: 0,
      notificationsCreated: 0,
      errors: [] as string[],
    }

    // Track staff notifications to avoid spamming the same admin for every missed exam
    const staffNotificationMap = new Map<
      string,
      {
        userId: string
        email: string | null
        names: string[]
        modules: string[]
        dates: string[]
      }
    >()

    // Run-scoped notification deduplication. Processing remains entity-scoped so
    // a booking is still reconciled when an assignment for the same student and
    // module was already handled.
    const notifiedStudentModules = new Set<string>()

    // 1. Reconcile ExamSittingAssignment records past their sitting time with no attendance
    const staleAssignments = await prisma.examSittingAssignment.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'ATTENDED', 'EXCUSED', 'ABSENT', 'ROLLED_FORWARD'] },
        sitting: {
          startTime: { lt: cutoff },
        },
      },
      include: {
        sitting: {
          include: {
            event: true,
          },
        },
        booking: {
          include: {
            user: true,
          },
        },
      },
    })

    const assignmentBookingIds = staleAssignments.map((assignment) => assignment.bookingId)
    const assignmentSittingIds = staleAssignments.map((assignment) => assignment.sittingId)
    const assignmentUserIds = staleAssignments.map((assignment) => assignment.booking.userId)
    const [assignmentAttendances, assignmentResults] = await Promise.all([
      assignmentBookingIds.length > 0 || assignmentSittingIds.length > 0
        ? prisma.examAttendance.findMany({
            where: {
              OR: [
                ...(assignmentBookingIds.length > 0
                  ? [{ bookingId: { in: assignmentBookingIds } }]
                  : []),
                ...(assignmentSittingIds.length > 0 && assignmentUserIds.length > 0
                  ? [{ sittingId: { in: assignmentSittingIds }, userId: { in: assignmentUserIds } }]
                  : []),
              ],
            },
            select: { bookingId: true, sittingId: true, userId: true },
          })
        : Promise.resolve([]),
      assignmentUserIds.length > 0
        ? prisma.examResult.findMany({
            where: {
              OR: staleAssignments.map((assignment) => ({
                userId: assignment.booking.userId,
                moduleCode: assignment.booking.moduleCode,
                examCategory: assignment.booking.examCategory,
                deletedAt: null,
              })),
            },
            select: { userId: true, moduleCode: true, examCategory: true },
          })
        : Promise.resolve([]),
    ])
    const assignmentAttendanceKeys = new Set(
      assignmentAttendances.map((attendance) =>
        attendance.bookingId
          ? `booking:${attendance.bookingId}`
          : `sitting:${attendance.sittingId}:${attendance.userId}`
      )
    )
    const assignmentResultKeys = new Set(
      assignmentResults.map((result) =>
        JSON.stringify([result.userId, result.moduleCode, result.examCategory])
      )
    )

    for (const assignment of staleAssignments) {
      const studentKey = getExamNotificationDedupeKey(
        assignment.booking.userId,
        assignment.booking.moduleCode
      )
      const alreadyNotified = notifiedStudentModules.has(studentKey)

      try {
        const attendanceKey = `booking:${assignment.bookingId}`
        const sittingAttendanceKey = `sitting:${assignment.sittingId}:${assignment.booking.userId}`
        if (
          assignmentAttendanceKeys.has(attendanceKey) ||
          assignmentAttendanceKeys.has(sittingAttendanceKey)
        ) {
          continue
        }

        const resultKey = JSON.stringify([
          assignment.booking.userId,
          assignment.booking.moduleCode,
          assignment.booking.examCategory,
        ])
        if (assignmentResultKeys.has(resultKey)) continue

        if (assignment.booking.score != null || assignment.booking.percentage != null) {
          continue
        }

        await markExamAttendance({
          bookingId: assignment.bookingId,
          sittingId: assignment.sittingId,
          status: 'ABSENT',
          recordedBy: 'cron-exam-reconciliation',
          notifyStudent: !alreadyNotified,
        })

        if (!alreadyNotified) {
          notifiedStudentModules.add(studentKey)
        }
        results.sittingsProcessed++
        if (!alreadyNotified) {
          results.notificationsCreated++
        }

        await notifyStaffAboutMissedExam(
          assignment.booking,
          assignment.sitting,
          staffNotificationMap
        )
      } catch (err: unknown) {
        results.errors.push(
          `Assignment ${assignment.id}: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }

    // 2. Reconcile ExamBooking records past their exam date with no attendance/result
    const staleBookings = await prisma.examBooking.findMany({
      where: {
        examDate: { lt: cutoff },
        deletedAt: null,
        demandStatus: { notIn: ['EXECUTED', 'ROLLED_FORWARD', 'CANCELLED', 'POSTPONED'] },
        result: null,
        score: null,
        percentage: null,
      },
      include: {
        user: true,
        event: true,
        exam: {
          include: {
            examComponent: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    })

    for (const booking of staleBookings) {
      const studentKey = getExamNotificationDedupeKey(booking.userId, booking.moduleCode)
      const alreadyNotified = notifiedStudentModules.has(studentKey)

      try {
        const existingAttendance = await prisma.examAttendance.findFirst({
          where: { bookingId: booking.id },
        })
        if (existingAttendance) continue

        const existingResult = await prisma.examResult.findFirst({
          where: {
            userId: booking.userId,
            moduleCode: booking.moduleCode,
            examCategory: booking.examCategory,
            deletedAt: null,
          },
        })
        if (existingResult) continue

        await markExamAttendance({
          bookingId: booking.id,
          status: 'ABSENT',
          recordedBy: 'cron-exam-reconciliation',
          notifyStudent: !alreadyNotified,
        })

        if (!alreadyNotified) {
          notifiedStudentModules.add(studentKey)
        }
        results.bookingsProcessed++
        if (!alreadyNotified) {
          results.notificationsCreated++
        }

        await notifyStaffAboutMissedExam(booking, null, staffNotificationMap)
      } catch (err: unknown) {
        results.errors.push(
          `Booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }

    // Send batched staff notification once after processing all bookings/sittings
    const flushResult = await flushStaffNotifications(staffNotificationMap)
    results.notificationsCreated += flushResult.notificationsCreated
    results.emailsSent += flushResult.emailsSent

    await createAuditLog({
      userId: 'cron-exam-reconciliation',
      action: AuditAction.SYSTEM_UPDATE,
      entity: 'ExamReconciliationRun',
      entityId: `exam-reconciliation-${Date.now()}`,
      description: 'Automated exam reconciliation completed',
      changes: { ...results },
    })

    return NextResponse.json({
      success: true,
      message: 'Exam reconciliation completed',
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Cron exam-reconciliation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

async function createNotificationForUser(
  userId: string,
  data: {
    type:
      | 'INFO'
      | 'SUCCESS'
      | 'WARNING'
      | 'ERROR'
      | 'CRITICAL'
      | 'POOL_UPDATE'
      | 'PAYMENT_UPDATE'
      | 'EXAM_REMINDER'
      | 'WALLET_ADJUSTMENT'
    title: string
    message: string
    link?: string
  }
) {
  await prisma.notification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      linkUrl: data.link,
    },
  })
}

async function notifyStaffAboutMissedExam(
  booking: {
    userId: string
    user?: { email?: string | null; profile?: { firstName?: string | null } | null } | null
    moduleCode?: string | null
    examDate?: Date | string | null
    event?: { name?: string | null } | null
  },
  sitting: {
    startTime?: Date | null
    event?: { name?: string | null } | null
  } | null,
  staffNotificationMap: Map<
    string,
    {
      userId: string
      email: string | null
      names: string[]
      modules: string[]
      dates: string[]
    }
  >
) {
  const examDate = sitting?.startTime || booking.examDate
  const staffId = 'staff-global'

  const entry = staffNotificationMap.get(staffId) || {
    userId: staffId,
    email: null,
    names: [],
    modules: [],
    dates: [],
  }

  entry.names.push(booking.user?.profile?.firstName || booking.user?.email || 'unknown')
  entry.modules.push(booking.moduleCode || 'unknown')
  entry.dates.push(formatDate(examDate))

  staffNotificationMap.set(staffId, entry)
}

export async function flushStaffNotifications(
  staffNotificationMap: Map<
    string,
    {
      userId: string
      email: string | null
      names: string[]
      modules: string[]
      dates: string[]
    }
  >
): Promise<{ notificationsCreated: number; emailsSent: number }> {
  if (staffNotificationMap.size === 0) return { notificationsCreated: 0, emailsSent: 0 }

  // Fetch staff users once
  const staffUsers = await prisma.user.findMany({
    where: {
      role: { in: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    },
    select: { id: true, email: true },
  })

  const globalEntry = staffNotificationMap.get('staff-global')
  if (!globalEntry) return { notificationsCreated: 0, emailsSent: 0 }

  const missedCount = globalEntry.names.length
  const summaryMessage = `${missedCount} exam(s) marked as missed:\n${globalEntry.modules.map((m: string, i: number) => `- ${m} on ${globalEntry.dates[i]}`).join('\n')}`

  const staffResults = await Promise.all(
    staffUsers.map(async (staff) => {
      await createNotificationForUser(staff.id, {
        type: 'WARNING',
        title: 'Exams Missed — Action Required',
        message: summaryMessage,
        link: `/staff/dashboard`,
      })

      let emailSent = false
      if (staff.email) {
        const html = `
          <p>Dear Admin,</p>
          <p>The following ${missedCount} exam(s) were marked as missed by the automated reconciliation cron:</p>
          <ul>
            ${globalEntry.names
              .map(
                (name: string, i: number) => `
              <li><strong>Student:</strong> ${name}</li>
              <li><strong>Module:</strong> ${globalEntry.modules[i]}</li>
              <li><strong>Date:</strong> ${globalEntry.dates[i]}</li>
            `
              )
              .join('\n')}
          </ul>
          <p>Please review and take appropriate action (refund or rebook).</p>
        `
        const emailResult = await sendEmail({
          to: staff.email,
          subject: `${missedCount} Exam(s) Missed — Action Required`,
          html,
          template: 'exam-missed-staff',
          userId: staff.id,
        })
        emailSent = emailResult.success
      }

      return { notificationCreated: true, emailSent }
    })
  )

  const notificationsCreated = staffResults.filter((r) => r.notificationCreated).length
  const emailsSent = staffResults.filter((r) => r.emailSent).length

  return { notificationsCreated, emailsSent }
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
