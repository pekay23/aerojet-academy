'use server'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'



import { getRegistrationConfig, getExamsConfig } from '@/lib/settings'

const _DISMISSABLE_TITLES = new Set([
  'Pending Payments >7 Days',
  'Fraud Referrals Pending Review',
  'Expiring Exam Bundles',
  'Supabase Mirror Backlog',
  'Email Delivery Failures',
  'Internal Exam Reports Pending',
])

async function createIfMissing(userId: string, data: {
  type: 'CRITICAL' | 'WARNING' | 'ERROR' | 'INFO'
  title: string
  message: string
  linkUrl?: string
  linkText?: string
}) {
  const existing = await prismaUnfiltered.notification.findFirst({
    where: {
      userId,
      title: data.title,
      isRead: false,
    },
  })

  if (existing) {
    // Update message/link if the condition still applies but notification exists
    await prismaUnfiltered.notification.update({
      where: { id: existing.id },
      data: {
        message: data.message,
        linkUrl: data.linkUrl || existing.linkUrl,
        linkText: data.linkText || existing.linkText,
      },
    })
    return
  }

  await prismaUnfiltered.notification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      linkUrl: data.linkUrl,
      linkText: data.linkText,
    },
  })
}

async function dismissIfExists(userId: string, title: string) {
  const existing = await prismaUnfiltered.notification.findFirst({
    where: { userId, title, isRead: false },
  })

  if (existing) {
    await prismaUnfiltered.notification.update({
      where: { id: existing.id },
      data: { isRead: true, readAt: new Date() },
    })
  }
}

export async function dismissStaffNotification(notificationId: string) {
  try {
    await prismaUnfiltered.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    })
    return { success: true }
  } catch {
    return { error: 'Failed to dismiss notification' }
  }
}

export async function ensureSystemNotifications() {
  try {
    const user = await requireStaff()
    const [registrationConfig, examsConfig] = await Promise.all([
      getRegistrationConfig(),
      getExamsConfig(),
    ])

    const now = new Date()
    const todayMinus7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [
      pendingPayments,
      overdueDsr,
      failingFraud,
      expiringBundles,
      mirrorBacklog,
      emailFailures24h,
      pendingExamReports,
    ] = await Promise.all([
      prismaUnfiltered.payment.count({
        where: { status: 'PENDING', createdAt: { lt: todayMinus7 } },
      }).catch(() => 0),

      prismaUnfiltered.dataSubjectRequest.count({
        where: {
          dueBy: { lt: now },
          status: { in: ['RECEIVED', 'IN_PROGRESS', 'AWAITING_USER'] },
        },
      }).catch(() => 0),

      prismaUnfiltered.referral.count({
        where: { fraudScore: { gte: 50 }, reviewedAt: null },
      }).catch(() => 0),

      prismaUnfiltered.examBundle.count({
        where: {
          validUntil: { gte: tomorrow, lte: sevenDaysOut },
          status: 'ACTIVE',
        },
      }).catch(() => 0),

      prismaUnfiltered.fileUpload.count({
        where: {
          mirroredAt: null,
          supabasePath: { not: null },
          createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      }).catch(() => 0),

      prismaUnfiltered.emailDelivery.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      }).catch(() => 0),

      prismaUnfiltered.internalExamReport.count({
        where: { status: 'PENDING' },
      }).catch(() => 0),
    ])

    // ── CRITICAL (non-dismissable) ──────────────────────────────────────

    // 1. Registration closed
    if (!registrationConfig.isOpen) {
      await createIfMissing(user.id, {
        type: 'CRITICAL',
        title: 'Registration Closed',
        message:
          'Training programs and new registrations are currently paused on the public site.',
        linkUrl: '/staff/settings?tab=general',
        linkText: 'Manage Settings',
      })
    } else {
      await dismissIfExists(user.id, 'Registration Closed')
    }

    // 2. Exam bookings closed
    if (!examsConfig.isOpen) {
      await createIfMissing(user.id, {
        type: 'CRITICAL',
        title: 'Exam Bookings Closed',
        message:
          'Public exam booking and enrollment are currently disabled.',
        linkUrl: '/staff/settings?tab=general',
        linkText: 'Manage Settings',
      })
    } else {
      await dismissIfExists(user.id, 'Exam Bookings Closed')
    }

    // 3. Overdue GDPR DSRs (legal deadline)
    if (overdueDsr > 0) {
      await createIfMissing(user.id, {
        type: 'CRITICAL',
        title: 'GDPR Requests Overdue',
        message: `${overdueDsr} data subject request${overdueDsr === 1 ? '' : 's'} past the 30-day SLA.`,
        linkUrl: '/staff/gdpr',
        linkText: 'View DSR Queue',
      })
    } else {
      await dismissIfExists(user.id, 'GDPR Requests Overdue')
    }

    // 4. Email delivery failures >= 10 in 24h
    if (emailFailures24h >= 10) {
      await createIfMissing(user.id, {
        type: 'CRITICAL',
        title: 'Email Delivery Failures',
        message: `${emailFailures24h} emails failed to deliver in the last 24 hours.`,
        linkUrl: '/staff/settings?tab=email-delivery',
        linkText: 'View Email Log',
      })
    } else if (emailFailures24h > 0 && emailFailures24h < 10) {
      await dismissIfExists(user.id, 'Email Delivery Failures')
    }

    // ── DISMISSABLE ─────────────────────────────────────────────────────

    // 5. Pending payments >7 days
    if (pendingPayments > 0) {
      await createIfMissing(user.id, {
        type: pendingPayments > 10 ? 'WARNING' : 'INFO',
        title: 'Pending Payments >7 Days',
        message: `${pendingPayments} payment${pendingPayments === 1 ? '' : 's'} awaiting reconciliation for over 7 days.`,
        linkUrl: '/staff/payments?status=PENDING',
        linkText: 'Review Payments',
      })
    } else {
      await dismissIfExists(user.id, 'Pending Payments >7 Days')
    }

    // 6. Fraud-flagged referrals
    if (failingFraud > 0) {
      await createIfMissing(user.id, {
        type: 'WARNING',
        title: 'Fraud Referrals Pending Review',
        message: `${failingFraud} referral${failingFraud === 1 ? '' : 's'} flagged for fraud (score ≥ 50).`,
        linkUrl: '/staff/referrals?minFraud=50',
        linkText: 'Review Referrals',
      })
    } else {
      await dismissIfExists(user.id, 'Fraud Referrals Pending Review')
    }

    // 7. Expiring bundles
    if (expiringBundles > 0) {
      await createIfMissing(user.id, {
        type: 'INFO',
        title: 'Expiring Exam Bundles',
        message: `${expiringBundles} exam bundle${expiringBundles === 1 ? '' : 's'} expiring this week.`,
        linkUrl: '/staff/exams?filter=expiring',
        linkText: 'View Bundles',
      })
    } else {
      await dismissIfExists(user.id, 'Expiring Exam Bundles')
    }

    // 8. Mirror backlog
    if (mirrorBacklog > 0) {
      await createIfMissing(user.id, {
        type: mirrorBacklog > 100 ? 'WARNING' : 'INFO',
        title: 'Supabase Mirror Backlog',
        message: `${mirrorBacklog} file${mirrorBacklog === 1 ? '' : 's'} not yet mirrored to Supabase.`,
        linkUrl: '/staff/admin/permissions',
        linkText: 'View Details',
      })
    } else {
      await dismissIfExists(user.id, 'Supabase Mirror Backlog')
    }

    // 9. Internal exam reports pending
    if (pendingExamReports > 0) {
      await createIfMissing(user.id, {
        type: pendingExamReports >= 5 ? 'WARNING' : 'INFO',
        title: 'Internal Exam Reports Pending',
        message: `${pendingExamReports} internal exam report${pendingExamReports === 1 ? '' : 's'} awaiting review.`,
        linkUrl: '/staff/exams/internal?view=operations',
        linkText: 'Review Reports',
      })
    } else {
      await dismissIfExists(user.id, 'Internal Exam Reports Pending')
    }

    return { success: true }
  } catch (_error) {
    return { error: 'Failed to ensure system notifications' }
  }
}
