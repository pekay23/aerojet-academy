import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { sendPaymentDeadlineEmail } from '@/lib/email/service'
import { createAuditLog } from '@/lib/audit/logger'
import { env } from '@/lib/env'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const results = { remindersSent: 0, forfeited: 0, errors: [] as string[] }

    // Deadlines to check: T-28, T-24, T-22
    const targetDays = [28, 24, 22]

    // Process reminders for each target day
    for (const days of targetDays) {
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      const targetStart = new Date(targetDate)
      targetStart.setHours(0, 0, 0, 0)
      const targetEnd = new Date(targetDate)
      targetEnd.setHours(23, 59, 59, 999)

      // Find events starting on this target day
      const events = await prisma.examEvent.findMany({
        where: {
          startDate: { gte: targetStart, lte: targetEnd },
          status: { in: ['OPEN', 'CONFIRMED'] },
        },
        select: { id: true, name: true, startDate: true },
      })

      for (const event of events) {
        // Find bookings in this event that are INDIVIDUAL and PENDING
        const pendingBookings = await prisma.examBooking.findMany({
          where: {
            eventId: event.id,
            bookingType: 'INDIVIDUAL',
            status: 'PENDING',
          },
          include: {
            user: { include: { profile: true } },
            examComponent: { include: { course: { select: { code: true } } } },
          },
        })

        if (pendingBookings.length > 0) {
          // Fetch individual price to know the balance
          const { getExamPricingConfig } = await import('@/lib/pools/pricing-config')
          const pricingConfig = await getExamPricingConfig()

          for (const booking of pendingBookings) {
            try {
              const email = booking.user.academyEmail || booking.user.email
              const name = booking.user.profile?.firstName || 'Student'
              const moduleLabel = booking.examComponent?.course?.code ?? 'Module'

              // Booking amountPaid is the 50% deposit, so the remaining is the total subtract amountPaid
              const balance = pricingConfig.individualExamFee - Number(booking.amountPaid)

              await sendPaymentDeadlineEmail(email, name, moduleLabel, event.name, days, balance)

              results.remindersSent++
            } catch (err: any) {
              results.errors.push(`Reminder for booking ${booking.id}: ${err.message}`)
            }
          }
        }
      }
    }

    // Now handle T-21 Forfeitures
    const t21Date = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
    const t21Start = new Date(t21Date)
    t21Start.setHours(0, 0, 0, 0)
    const t21End = new Date(t21Date)
    t21End.setHours(23, 59, 59, 999)

    const t21Events = await prisma.examEvent.findMany({
      where: {
        startDate: { gte: t21Start, lte: t21End },
        status: { in: ['OPEN', 'CONFIRMED'] },
      },
    })

    for (const event of t21Events) {
      const expiredBookings = await prisma.examBooking.findMany({
        where: {
          eventId: event.id,
          bookingType: 'INDIVIDUAL',
          status: 'PENDING',
        },
      })

      for (const booking of expiredBookings) {
        try {
          await prisma.examBooking.update({
            where: { id: booking.id },
            data: { status: 'FAILED' }, // Mark as failed due to non-payment
          })

          await createAuditLog({
            action: 'UPDATE',
            entity: 'ExamBooking',
            entityId: booking.id,
            userId: booking.userId,
            details: { reason: 'Failed to pay individual booking balance by T-21 deadline' },
          })

          results.forfeited++
        } catch (err: any) {
          results.errors.push(`Forfeiting booking ${booking.id}: ${err.message}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment deadlines processed',
      results,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('Cron payment-deadlines error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
