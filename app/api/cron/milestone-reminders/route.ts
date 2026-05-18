import { NextRequest } from 'next/server'
import { env } from '@/lib/env'
import prisma from '@/lib/prisma/client'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { sendMilestoneReminderEmail } from '@/lib/email/service'
import { createNotification } from '@/lib/email/service'

const REMINDER_DAYS = [14, 7, 1]

function getReminderType(daysUntil: number): string | null {
  if (daysUntil === 14) return '14_DAY'
  if (daysUntil === 7) return '7_DAY'
  if (daysUntil === 1) return '1_DAY'
  return null
}

function getDaysUntilDue(dueDate: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

async function checkAndSendReminders() {
  const results = {
    sent: 0,
    skipped: 0,
    errors: [] as string[],
  }

  const allMilestones = await prisma.paymentMilestone.findMany({
    where: {
      status: { in: ['DUE', 'OVERDUE'] },
    },
    take: 500, // Prevent unbounded fetch
    include: {
      enrollment: {
        include: {
          student: {
            include: { profile: true },
          },
          programme: true,
        },
      },
    },
  })

  // Filter to only milestones that match our reminder days
  const actionableMilestones = allMilestones.filter((m) => {
    const daysUntil = getDaysUntilDue(m.dueDate)
    return daysUntil >= 0 && getReminderType(daysUntil) !== null
  })

  if (actionableMilestones.length === 0) {
    return results
  }

  // Batch idempotency check: find all existing reminders in the last 7 days for these students
  const studentIds = [...new Set(actionableMilestones.map((m) => m.enrollment.studentId))]
  const existingReminders = await prisma.notification.findMany({
    where: {
      userId: { in: studentIds },
      title: { startsWith: 'Payment Reminder - ' },
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: { userId: true, title: true, message: true },
  })

  // Build lookup: "userId:reminderType:milestoneType"
  const reminderSet = new Set(
    existingReminders.map((r) => {
      const type = r.title.replace('Payment Reminder - ', '')
      return `${r.userId}:${type}`
    })
  )

  for (const milestone of actionableMilestones) {
    try {
      const daysUntil = getDaysUntilDue(milestone.dueDate)
      const reminderType = getReminderType(daysUntil)!

      const key = `${milestone.enrollment.studentId}:${reminderType}`
      if (reminderSet.has(key)) {
        results.skipped++
        continue
      }

      const student = milestone.enrollment.student
      const profile = student.profile

      if (!profile) {
        results.errors.push(`No profile for student ${student.id}`)
        continue
      }

      await sendMilReminderEmail(
        student.email,
        profile.firstName,
        milestone.milestoneType,
        Number(milestone.amountDue),
        daysUntil,
        milestone.enrollment.programme.name
      )

      await prisma.notification.create({
        data: {
          userId: student.id,
          type: 'PAYMENT_UPDATE',
          title: `Payment Reminder - ${reminderType}`,
          message: `Your ${milestone.milestoneType} payment of €${milestone.amountDue} is due in ${daysUntil} days.`,
          linkUrl: '/student/wallet?tab=payments',
        },
      })

      reminderSet.add(key) // Prevent duplicates within same run
      results.sent++
    } catch (err) {
      const error = err as Error
      results.errors.push(`Error processing milestone ${milestone.id}: ${error.message}`)
    }
  }

  return results
}

async function sendMilReminderEmail(
  email: string,
  firstName: string,
  milestoneType: string,
  amount: number,
  daysUntil: number,
  programmeName: string
) {
  const { renderMilestoneReminderEmail, sendEmail } = await import('@/lib/email/service')

  const milestoneLabel =
    {
      SEAT_CONFIRMATION: 'Seat Confirmation',
      SEM1_DUE: 'Semester 1 Payment',
      SEM2_DUE: 'Semester 2 Payment',
    }[milestoneType] || milestoneType

  const html = await renderMilestoneReminderEmail(
    firstName,
    milestoneLabel,
    amount,
    daysUntil,
    programmeName
  )

  return sendEmail({
    to: email,
    subject: `Payment Reminder: ${milestoneLabel} due in ${daysUntil} days`,
    html,
  })
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const cronSecret = env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return apiError('Unauthorized', 401)
  }

  const results = await checkAndSendReminders()

  return apiSuccess({
    message: `Milestone reminder check complete`,
    ...results,
  })
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const cronSecret = env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return apiError('Unauthorized', 401)
  }

  const results = await checkAndSendReminders()
  return apiSuccess({
    message: `Milestone reminder check complete`,
    ...results,
  })
})
