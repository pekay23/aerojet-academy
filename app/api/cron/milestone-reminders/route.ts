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

  for (const milestone of allMilestones) {
    try {
      const daysUntil = getDaysUntilDue(milestone.dueDate)
      const reminderType = getReminderType(daysUntil)

      if (!reminderType) {
        results.skipped++
        continue
      }

      if (daysUntil < 0) {
        results.skipped++
        continue
      }

      const existingReminder = await prisma.notification.findFirst({
        where: {
          userId: milestone.enrollment.studentId,
          title: {
            contains: `Payment Reminder - ${reminderType}`,
          },
          message: {
            contains: milestone.milestoneType,
          },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      })

      if (existingReminder) {
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

export const POST = withErrorHandler(async () => {
  const results = await checkAndSendReminders()
  return apiSuccess({
    message: `Milestone reminder check complete`,
    ...results,
  })
})
