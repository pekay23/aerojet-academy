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
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    // Fetch pricing config once
    const { getExamPricingConfig } = await import('@/lib/pools/pricing-config')
    const pricingConfig = await getExamPricingConfig()

    // Build date ranges for all target days at once
    const dateRanges = targetDays.map((days) => {
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      const start = new Date(targetDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(targetDate)
      end.setHours(23, 59, 59, 999)
      return { days, start, end }
    })

    // Fetch all relevant events across all target date ranges in one query
    const allEvents = await prisma.examEvent.findMany({
      where: {
        OR: dateRanges.map(({ start, end }) => ({
          startDate: { gte: start, lte: end },
        })),
        status: { in: ['OPEN', 'CONFIRMED'] },
      },
      select: { id: true, name: true, startDate: true },
    })

    if (allEvents.length > 0) {
      // Fetch all pending individual bookings for these events in one query
      const pendingBookings = await prisma.examBooking.findMany({
        where: {
          eventId: { in: allEvents.map((e) => e.id) },
          bookingType: 'INDIVIDUAL',
          status: 'PENDING',
        },
        include: {
          user: { include: { profile: true } },
          examComponent: { include: { course: { select: { code: true } } } },
        },
      })

      // Batch idempotency check: find all existing reminders sent today
      const bookingUserIds = [...new Set(pendingBookings.map((b) => b.userId))]
      const existingReminders = await prisma.notification.findMany({
        where: {
          userId: { in: bookingUserIds },
          type: 'WARNING',
          title: { startsWith: 'Payment Reminder T-' },
          createdAt: { gte: todayStart },
        },
        select: { userId: true, title: true },
      })

      // Create a Set for fast lookup: "userId:T-28"
      const reminderSet = new Set(existingReminders.map((r) => `${r.userId}:${r.title}`))

      // Map event IDs to their target day
      const eventToDays = new Map<string, number>()
      for (const event of allEvents) {
        for (const { days, start, end } of dateRanges) {
          if (event.startDate >= start && event.startDate <= end) {
            eventToDays.set(event.id, days)
          }
        }
      }

      const eventMap = new Map(allEvents.map((e) => [e.id, e]))

      for (const booking of pendingBookings) {
        if (!booking.eventId) continue
        const days = eventToDays.get(booking.eventId)
        if (!days) continue
        const event = eventMap.get(booking.eventId)!

        const reminderKey = `${booking.userId}:Payment Reminder T-${days}`
        if (reminderSet.has(reminderKey)) continue // Already reminded today

        try {
          const email = booking.user.personalEmail || booking.user.email
          const name = booking.user.profile?.firstName || 'Student'
          const moduleLabel = booking.examComponent?.course?.code ?? 'Module'
          const balance = pricingConfig.individualExamFee - Number(booking.amountPaid)

          await sendPaymentDeadlineEmail(email, name, moduleLabel, event.name, days, balance)

          await prisma.notification.create({
            data: {
              userId: booking.userId,
              title: `Payment Reminder T-${days}`,
              message: `Balance of €${balance} due for ${moduleLabel} exam`,
              type: 'WARNING',
            },
          })

          results.remindersSent++
        } catch (err: any) {
          results.errors.push(`Reminder for booking ${booking.id}: ${err.message}`)
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
      select: { id: true },
    })

    if (t21Events.length > 0) {
      // Fetch all pending bookings for T-21 events in one query
      const expiredBookings = await prisma.examBooking.findMany({
        where: {
          eventId: { in: t21Events.map((e) => e.id) },
          bookingType: 'INDIVIDUAL',
          status: 'PENDING',
        },
      })

      // Batch: find all linked pending/approved payments for these bookings
      const bookingIds = expiredBookings.map((b) => b.id)
      const linkedPayments = await prisma.payment.findMany({
        where: {
          referenceId: { in: bookingIds },
          status: { in: ['PENDING', 'APPROVED'] },
        },
        select: { id: true, referenceId: true, status: true },
      })
      const paymentByBooking = new Map(linkedPayments.map((p) => [p.referenceId, p]))

      for (const booking of expiredBookings) {
        try {
          const linkedPayment = paymentByBooking.get(booking.id)
          if (linkedPayment) {
            results.errors.push(
              `Booking ${booking.id}: skipped forfeit — payment ${linkedPayment.id} (${linkedPayment.status}) exists`
            )
            continue
          }

          await prisma.examBooking.update({
            where: { id: booking.id, status: 'PENDING' }, // optimistic concurrency
            data: { status: 'FAILED' },
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
