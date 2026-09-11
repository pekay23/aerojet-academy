import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { getSystemSetting } from '@/lib/settings'
import { sendEmail } from '@/lib/email/sender'
import { env } from '@/lib/env'
import { markExamAttendance } from '@/lib/exams/attendance'

// Default grace period in hours if system setting is missing
const DEFAULT_GRACE_HOURS = 24

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const graceHours = Number(
      await getSystemSetting('exam_reconciliation_grace_hours', String(DEFAULT_GRACE_HOURS))
    )
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

    // 1. Reconcile ExamSittingAssignment records past their sitting time with no attendance
    const staleAssignments = await prisma.examSittingAssignment.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'ATTENDED', 'EXCUSED'] },
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

    for (const assignment of staleAssignments) {
      try {
        // Skip if attendance already exists
        const existingAttendance = await prisma.examAttendance.findFirst({
          where: {
            OR: [{ membershipId: assignment.id }, { bookingId: assignment.bookingId }],
          },
        })
        if (existingAttendance) continue

        // Skip if result already exists
        const existingResult = await prisma.examResult.findFirst({
          where: {
            userId: assignment.booking.userId,
            moduleCode: assignment.booking.moduleCode,
            deletedAt: null,
          },
        })
        if (existingResult) continue

        // Mark as ABSENT
        await markExamAttendance({
          bookingId: assignment.bookingId,
          status: 'ABSENT',
          recordedBy: 'cron-exam-reconciliation',
        })

        results.sittingsProcessed++

        // Notify student
        if (assignment.booking.user?.email) {
          await createNotificationForUser(assignment.booking.userId, {
            type: 'EXAM_REMINDER',
            title: 'Exam Marked as Absent',
            message: `Your exam for ${assignment.booking.moduleCode} on ${formatDate(assignment.sitting.startTime)} has been marked as absent due to non-attendance.`,
            link: `/student/exams`,
          })
          results.notificationsCreated++
        }

        // Notify staff/admin
        await notifyStaffAboutMissedExam(
          assignment.booking,
          assignment.sitting,
          staffNotificationMap
        )
        results.notificationsCreated++
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
      try {
        // Skip if attendance already exists
        const existingAttendance = await prisma.examAttendance.findFirst({
          where: {
            OR: [{ membershipId: booking.id }, { bookingId: booking.id }],
          },
        })
        if (existingAttendance) continue

        // Skip if result already exists
        const existingResult = await prisma.examResult.findFirst({
          where: {
            userId: booking.userId,
            moduleCode: booking.moduleCode,
            deletedAt: null,
          },
        })
        if (existingResult) continue

        // Mark as NO_SHOW via markExamAttendance
        await markExamAttendance({
          bookingId: booking.id,
          status: 'ABSENT',
          recordedBy: 'cron-exam-reconciliation',
        })

        results.bookingsProcessed++

        // Notify student
        if (booking.user?.email) {
          await createNotificationForUser(booking.userId, {
            type: 'EXAM_REMINDER',
            title: 'Exam Marked as Missed',
            message: `Your exam for ${booking.moduleCode} on ${formatDate(booking.examDate)} has been marked as missed. Please contact the academy to rebook.`,
            link: `/student/exams`,
          })
          results.notificationsCreated++
        }

        // Notify staff/admin
        await notifyStaffAboutMissedExam(booking, null, staffNotificationMap)
        results.notificationsCreated++
      } catch (err: unknown) {
        results.errors.push(
          `Booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }

    // Send batched staff notification once after processing all bookings/sittings
    await flushStaffNotifications(staffNotificationMap)

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

async function flushStaffNotifications(
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
  if (staffNotificationMap.size === 0) return

  // Fetch staff users once
  const staffUsers = await prisma.user.findMany({
    where: {
      role: { in: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    },
    select: { id: true, email: true },
    take: 10,
  })

  const globalEntry = staffNotificationMap.get('staff-global')
  if (!globalEntry) return

  const missedCount = globalEntry.names.length
  const summaryMessage = `${missedCount} exam(s) marked as missed:\n${globalEntry.modules.map((m: string, i: number) => `- ${m} on ${globalEntry.dates[i]}`).join('\n')}`

  for (const staff of staffUsers) {
    await createNotificationForUser(staff.id, {
      type: 'WARNING',
      title: 'Exams Missed — Action Required',
      message: summaryMessage,
      link: `/staff/dashboard`,
    })

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
      sendEmail({
        to: staff.email,
        subject: `${missedCount} Exam(s) Missed — Action Required`,
        html,
        template: 'exam-missed-staff',
        userId: staff.id,
      }).catch((error) => {
        console.error('[EMAIL ERROR] Failed to send missed exam summary to staff:', error)
      })
    }
  }
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
