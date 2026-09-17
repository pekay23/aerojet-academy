import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { sendModularDeadlineWarningEmail } from '@/lib/email/admissions'

/**
 * CRON: Modular Deadline Warnings
 * Runs daily — checks MODULAR students approaching their completion deadline.
 * Sends warnings at 75% and 90% elapsed thresholds.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find all active modular applications with a completion deadline
    const modularApps = await prismaUnfiltered.application.findMany({
      where: {
        programmeChoice: 'MODULAR',
        stage: 'ENROLLED',
        completionDeadline: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true } },
          },
        },
      },
    })

    let sent = 0
    for (const app of modularApps) {
      if (!app.user || !app.completionDeadline || !app.createdAt) continue

      const totalDuration = app.completionDeadline.getTime() - app.createdAt.getTime()
      const elapsed = now.getTime() - app.createdAt.getTime()
      const percentElapsed = Math.round((elapsed / totalDuration) * 100)

      // Only warn at 75% and 90% thresholds
      if (percentElapsed < 75) continue
      const threshold = percentElapsed >= 90 ? 90 : 75

      // Check if we already sent a warning for this threshold (within last 7 days)
      const alreadySent = await prismaUnfiltered.auditLog.findFirst({
        where: {
          action: `MODULAR_DEADLINE_WARNING_${threshold}`,
          targetId: app.id,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      })
      if (alreadySent) continue

      const firstName = app.user.profile?.firstName || 'Student'
      const deadline = app.completionDeadline.toLocaleDateString('en-GB', {
        year: 'numeric', month: 'long', day: 'numeric',
      })

      // Count remaining modular enrollments
      const totalModules = await prismaUnfiltered.modularEnrollment.count({
        where: { studentId: app.user.id },
      })
      const graduatedModules = await prismaUnfiltered.modularEnrollment.count({
        where: { studentId: app.user.id, status: 'GRADUATED' },
      })
      const remaining = Math.max(0, totalModules - graduatedModules)

      await sendModularDeadlineWarningEmail(app.user.email, firstName, threshold, deadline, remaining)

      // Log that we sent this warning to avoid re-sending
      await prismaUnfiltered.auditLog.create({
        data: {
          userId: app.user.id,
          action: `MODULAR_DEADLINE_WARNING_${threshold}`,
          targetType: 'APPLICATION',
          targetId: app.id,
          metadata: { percentElapsed: threshold, deadline },
        },
      })

      sent++
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} modular deadline warnings`,
      timestamp: now.toISOString(),
    })
  } catch (error: unknown) {
    console.error('[Cron] Modular deadline warnings failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
