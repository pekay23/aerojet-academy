import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { sendEmail } from '@/lib/email/service'
import { env } from '@/lib/env'

// Cron job: Send exam reminders to confirmed pool members
// Sends reminders at T-7 and T-1 days before exam
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const results = { reminders7Day: 0, reminders1Day: 0, errors: [] as string[] }

    // T-7 reminders
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const sevenDayStart = new Date(sevenDaysOut)
    sevenDayStart.setHours(0, 0, 0, 0)
    const sevenDayEnd = new Date(sevenDaysOut)
    sevenDayEnd.setHours(23, 59, 59, 999)

    const pools7Day = await prisma.examPool.findMany({
      where: {
        status: 'CONFIRMED',
        examDate: { gte: sevenDayStart, lte: sevenDayEnd },
      },
      include: {
        memberships: {
          where: { status: 'CONFIRMED' },
          include: {
            user: { include: { profile: true } },
            examComponent: { include: { course: { select: { code: true } } } },
          },
        },
        event: { select: { name: true } },
      },
    })

    for (const pool of pools7Day) {
      for (const membership of pool.memberships) {
        try {
          const email = membership.user.personalEmail || membership.user.email
          const name = membership.user.profile?.firstName || 'Student'
          const moduleLabel = membership.examComponent?.course?.code ?? 'Module'

          await sendEmail({
            to: email,
            subject: `Exam Reminder: 7 Days - ${pool.event.name}`,
            html: `<p>Dear ${name},</p>
              <p>This is a reminder that your exam is in <strong>7 days</strong>.</p>
              <p><strong>Pool:</strong> ${pool.name}<br/>
              <strong>Date:</strong> ${pool.examDate.toLocaleDateString()}<br/>
              <strong>Module:</strong> ${moduleLabel}<br/>
              <strong>Venue:</strong> TBA</p>
              <p>Please ensure you are prepared. Good luck!</p>`,
          })

          await prisma.notification.create({
            data: {
              userId: membership.userId,
              type: 'EXAM_REMINDER',
              title: 'Exam in 7 Days',
              message: `Your ${moduleLabel} exam is in 7 days on ${pool.examDate.toLocaleDateString()}.`,
            },
          })

          results.reminders7Day++
        } catch (err: any) {
          results.errors.push(`7-day reminder ${membership.userId}: ${err.message}`)
        }
      }
    }

    // T-1 reminders
    const oneDayOut = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
    const oneDayStart = new Date(oneDayOut)
    oneDayStart.setHours(0, 0, 0, 0)
    const oneDayEnd = new Date(oneDayOut)
    oneDayEnd.setHours(23, 59, 59, 999)

    const pools1Day = await prisma.examPool.findMany({
      where: {
        status: 'CONFIRMED',
        examDate: { gte: oneDayStart, lte: oneDayEnd },
      },
      include: {
        memberships: {
          where: { status: 'CONFIRMED' },
          include: {
            user: { include: { profile: true } },
            examComponent: { include: { course: { select: { code: true } } } },
          },
        },
        event: { select: { name: true } },
      },
    })

    for (const pool of pools1Day) {
      for (const membership of pool.memberships) {
        try {
          const email = membership.user.personalEmail || membership.user.email
          const name = membership.user.profile?.firstName || 'Student'
          const moduleLabel = membership.examComponent?.course?.code ?? 'Module'

          await sendEmail({
            to: email,
            subject: `Exam TOMORROW - ${pool.event.name}`,
            html: `<p>Dear ${name},</p>
              <p>Your exam is <strong>TOMORROW</strong>!</p>
              <p><strong>Pool:</strong> ${pool.name}<br/>
              <strong>Date:</strong> ${pool.examDate.toLocaleDateString()}<br/>
              <strong>Module:</strong> ${moduleLabel}<br/>
              <strong>Venue:</strong> TBA</p>
              <p>Please bring valid ID. Arrive 30 minutes early. Good luck!</p>`,
          })

          await prisma.notification.create({
            data: {
              userId: membership.userId,
              type: 'EXAM_REMINDER',
              title: 'Exam Tomorrow!',
              message: `Your ${moduleLabel} exam is TOMORROW.`,
            },
          })

          results.reminders1Day++
        } catch (err: any) {
          results.errors.push(`1-day reminder ${membership.userId}: ${err.message}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reminders sent',
      results,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('Cron send-reminders error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
