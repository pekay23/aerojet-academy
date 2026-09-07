import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { sendAptitudeTestReminderEmail } from '@/lib/email/admissions'

/**
 * CRON: Aptitude Test Reminders
 * Runs daily — nudges applicants who have been in APTITUDE_PENDING for >3 days
 * without completing their test.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

    // Find applications stuck in APTITUDE_PENDING for over 3 days
    const pending = await prismaUnfiltered.application.findMany({
      where: {
        stage: 'APTITUDE_PENDING',
        updatedAt: { lte: threeDaysAgo },
      },
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true } },
          },
        },
      },
    })

    let sent = 0
    for (const app of pending) {
      if (!app.user) continue
      const firstName = app.user.profile?.firstName || 'Applicant'
      const deadline = app.completionDeadline
        ? app.completionDeadline.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'as soon as possible'

      await sendAptitudeTestReminderEmail(app.user.email, firstName, deadline)
      sent++
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} aptitude test reminders`,
      timestamp: now.toISOString(),
    })
  } catch (error: unknown) {
    console.error('[Cron] Aptitude test reminders failed:', error instanceof Error ? error : 'Unknown error')
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
