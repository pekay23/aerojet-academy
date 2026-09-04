import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { sendEmail } from '@/lib/email/sender'
import { env } from '@/lib/env'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const results = { remindersSent: 0, errors: [] as string[] }

    // Check 30, 14, and 7 days ahead
    const windows = [30, 14, 7]
    const windowMap = new Map<number, Date>()

    for (const days of windows) {
      const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      windowMap.set(days, d)
    }

    // Documents expiring within 30 days
    const docs30 = windowMap.get(30)!
    const expiringDocs = await prisma.studentDocument.findMany({
      where: {
        expiresAt: { not: null, lte: docs30, gte: now },
        status: { not: 'ARCHIVED' },
      },
      select: {
        id: true,
        userId: true,
        type: true,
        title: true,
        expiresAt: true,
        user: {
          select: {
            email: true,
            personalEmail: true,
            profile: { select: { firstName: true } },
          },
        },
      },
      take: 200,
    })

    // Licenses expiring within 30 days
    const expiringLicenses = await prisma.studentLicenseTarget.findMany({
      where: {
        expiresAt: { not: null, lte: docs30, gte: now },
      },
      select: {
        id: true,
        expiresAt: true,
        validFrom: true,
        ratingClass: true,
        validityPeriodMonths: true,
        studentProfileId: true,
        licenseCategory: { select: { name: true } },
        studentProfile: {
          select: {
            userId: true,
            studentId: true,
            user: {
              select: {
                email: true,
                personalEmail: true,
                profile: { select: { firstName: true } },
              },
            },
          },
        },
      },
      take: 200,
    })

    // Batch idempotency: avoid duplicate reminders within 24h
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const allUserIds = [
      ...new Set([
        ...expiringDocs.map((d) => d.userId),
        ...expiringLicenses.map((l) => l.studentProfile.userId),
      ]),
    ]

    const existingReminders = await prisma.notification.findMany({
      where: {
        userId: { in: allUserIds },
        type: 'WARNING',
        title: { startsWith: 'Renewal Reminder: ' },
        createdAt: { gte: todayStart },
      },
      select: { userId: true, title: true },
    })

    const reminderSet = new Set(existingReminders.map((r) => `${r.userId}:${r.title}`))

    const _fromEmail = process.env.FROM_EMAIL || 'Aerojet Academy <admissions@mail.aerojet-academy.com>'

    // Send document reminders
    for (const doc of expiringDocs) {
      const days = Math.ceil((new Date(doc.expiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const reminderKey = `${doc.userId}:Renewal Reminder: ${doc.title}`
      if (reminderSet.has(reminderKey)) continue

      try {
        const email = doc.user.personalEmail || doc.user.email
        const name = doc.user.profile?.firstName || 'Student'

        await sendEmail({
          to: email,
          subject: `Renewal Reminder: ${doc.title} expires in ${days} days`,
          html: `
            <p>Dear ${name},</p>
            <p>Your document <strong>${doc.title}</strong> (${doc.type}) is set to expire on <strong>${new Date(doc.expiresAt!).toLocaleDateString()}</strong> (in ${days} days).</p>
            <p>Please upload a renewed copy to the student portal to avoid any disruption to your studies.</p>
            <p>Best regards,<br/>Aerojet Academy</p>
          `,
          template: 'renewal-reminder',
          userId: doc.userId,
        })

        await prisma.notification.create({
          data: {
            userId: doc.userId,
            title: `Renewal Reminder: ${doc.title}`,
            message: `${doc.title} expires in ${days} days`,
            type: 'WARNING',
          },
        })

        results.remindersSent++
      } catch (err: any) {
        results.errors.push(`Document ${doc.id}: ${err.message}`)
      }
    }

    // Send license reminders
    for (const lic of expiringLicenses) {
      const days = Math.ceil((new Date(lic.expiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const reminderKey = `${lic.studentProfile.userId}:Renewal Reminder: ${lic.licenseCategory.name}`
      if (reminderSet.has(reminderKey)) continue

      try {
        const email = lic.studentProfile.user.personalEmail || lic.studentProfile.user.email
        const name = lic.studentProfile.user.profile?.firstName || 'Student'

        await sendEmail({
          to: email,
          subject: `Renewal Reminder: ${lic.licenseCategory.name} expires in ${days} days`,
          html: `
            <p>Dear ${name},</p>
            <p>Your license <strong>${lic.licenseCategory.name}</strong> is set to expire on <strong>${new Date(lic.expiresAt!).toLocaleDateString()}</strong> (in ${days} days).</p>
            <p>Please ensure your license documentation is renewed before the expiry date to maintain your enrollment status.</p>
            <p>Best regards,<br/>Aerojet Academy</p>
          `,
          template: 'renewal-reminder',
          userId: lic.studentProfile.userId,
        })

        await prisma.notification.create({
          data: {
            userId: lic.studentProfile.userId,
            title: `Renewal Reminder: ${lic.licenseCategory.name}`,
            message: `${lic.licenseCategory.name} expires in ${days} days`,
            type: 'WARNING',
          },
        })

        results.remindersSent++
      } catch (err: any) {
        results.errors.push(`License ${lic.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Renewal reminders processed',
      results,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('Cron renewal-reminders error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
