import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { sendInterviewReminderEmail } from '@/lib/email/admissions'

/**
 * CRON: Interview Reminders
 * Runs daily — sends reminders 24h before scheduled interviews.
 * Secured by CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Find interview slots happening in the next 24 hours
    const upcomingSlots = await prismaUnfiltered.interviewSlot.findMany({
      where: {
        date: {
          gte: now,
          lte: tomorrow,
        },
      },
      include: {
        applications: {
          where: { stage: 'INTERVIEW_SCHEDULED' },
          include: {
            user: {
              select: {
                email: true,
                profile: { select: { firstName: true } },
              },
            },
          },
        },
      },
    })

    let sent = 0
    for (const slot of upcomingSlots) {
      for (const app of slot.applications) {
        if (!app.user) continue
        const firstName = app.user.profile?.firstName || 'Applicant'
        const date = slot.date.toLocaleDateString('en-GB', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
        const time = slot.startTime.toLocaleTimeString('en-GB', {
          hour: '2-digit', minute: '2-digit',
        })
        const location = slot.location || 'Aerojet Academy Campus'

        await sendInterviewReminderEmail(app.user.email, firstName, date, time, location)
        sent++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} interview reminders`,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('[Cron] Interview reminders failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
