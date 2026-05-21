/**
 * A.1.b — Dashboard alerts.
 *
 * Five cheap query checks that surface "things that need an admin's eye
 * today". Cached 5 minutes via `unstable_cache`; the AlertsCenter polls every
 * 60 seconds and re-fetches via revalidateTag if a fresh tick is overdue.
 */

import 'server-only'
import { unstable_cache } from 'next/cache'
import { prismaUnfiltered } from '@/lib/prisma/client'

export interface DashboardAlert {
  id: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  title: string
  description: string
  href?: string
  count?: number
}

export const DASHBOARD_ALERTS_TAG = 'dashboard-alerts'

async function compute(): Promise<DashboardAlert[]> {
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
    // 1) Payments awaiting review for >7 days
    prismaUnfiltered.payment.count({
      where: { status: 'PENDING', createdAt: { lt: todayMinus7 } },
    }).catch(() => 0),

    // 2) DSR with dueBy in the past and still open
    prismaUnfiltered.dataSubjectRequest.count({
      where: {
        dueBy: { lt: now },
        status: { in: ['RECEIVED', 'IN_PROGRESS', 'AWAITING_USER'] },
      },
    }).catch(() => 0),

    // 3) Referrals with fraudScore >= 50 awaiting review
    prismaUnfiltered.referral.count({
      where: { fraudScore: { gte: 50 }, reviewedAt: null },
    }).catch(() => 0),

    // 4) ExamBundles expiring in next 7 days with unused resits
    prismaUnfiltered.examBundle.count({
      where: {
        expiresAt: { gte: tomorrow, lte: sevenDaysOut },
        status: { in: ['ACTIVE'] as any },
      },
    }).catch(() => 0),

    // 5) FileUpload rows older than 24h still unmirrored
    prismaUnfiltered.fileUpload.count({
      where: {
        mirroredAt: null,
        supabasePath: { not: null },
        createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    }).catch(() => 0),

    // 6) Email deliveries that failed in the last 24h
    prismaUnfiltered.emailDelivery.count({
      where: {
        status: 'FAILED',
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    }).catch(() => 0),

    // 7) Internal exam reports awaiting staff review
    prismaUnfiltered.internalExamReport.count({
      where: { status: 'PENDING' },
    }).catch(() => 0),
  ])

  const alerts: DashboardAlert[] = []

  if (pendingPayments > 0) {
    alerts.push({
      id: 'pending-payments',
      severity: pendingPayments > 10 ? 'CRITICAL' : 'WARNING',
      title: `${pendingPayments} payment${pendingPayments === 1 ? '' : 's'} awaiting reconciliation > 7 days`,
      description: 'Old payment proofs slow the admissions queue and may breach our SLA.',
      href: '/staff/payments?status=PENDING',
      count: pendingPayments,
    })
  }

  if (overdueDsr > 0) {
    alerts.push({
      id: 'overdue-dsr',
      severity: 'CRITICAL',
      title: `${overdueDsr} GDPR request${overdueDsr === 1 ? '' : 's'} past 30-day SLA`,
      description: 'GDPR Article 12(3) requires response within 30 days. Resolve immediately.',
      href: '/staff/gdpr',
      count: overdueDsr,
    })
  }

  if (failingFraud > 0) {
    alerts.push({
      id: 'fraud-referrals',
      severity: 'WARNING',
      title: `${failingFraud} referral${failingFraud === 1 ? '' : 's'} flagged for fraud review`,
      description: 'Fraud score ≥ 50. Disqualify or clear before payout.',
      href: '/staff/referrals?minFraud=50',
      count: failingFraud,
    })
  }

  if (expiringBundles > 0) {
    alerts.push({
      id: 'expiring-bundles',
      severity: 'INFO',
      title: `${expiringBundles} exam bundle${expiringBundles === 1 ? '' : 's'} expiring this week`,
      description: 'Students may need a heads-up to use remaining sittings.',
      href: '/staff/exams?filter=expiring',
      count: expiringBundles,
    })
  }

  if (mirrorBacklog > 0) {
    alerts.push({
      id: 'mirror-backlog',
      severity: mirrorBacklog > 100 ? 'WARNING' : 'INFO',
      title: `${mirrorBacklog} UploadThing file${mirrorBacklog === 1 ? '' : 's'} not yet mirrored to Supabase`,
      description: 'The nightly mirror cron may need attention.',
      href: '/staff/admin/permissions', // placeholder — no admin "sync" page yet
      count: mirrorBacklog,
    })
  }

  if (emailFailures24h > 0) {
    alerts.push({
      id: 'email-failures',
      severity: emailFailures24h >= 10 ? 'CRITICAL' : 'WARNING',
      title: `${emailFailures24h} email${emailFailures24h === 1 ? '' : 's'} failed to deliver in the last 24h`,
      description:
        'Transient Resend errors are retried automatically; persistent failures may signal a domain, DNS, or rate-limit issue.',
      href: '/staff/settings?tab=email-delivery',
      count: emailFailures24h,
    })
  }

  if (pendingExamReports > 0) {
    alerts.push({
      id: 'exam-reports',
      severity: pendingExamReports >= 5 ? 'WARNING' : 'INFO',
      title: `${pendingExamReports} internal exam report${pendingExamReports === 1 ? '' : 's'} awaiting review`,
      description:
        'Students have flagged issues with submitted exams (typo, ambiguous answer, etc.). Review in the exam Operations dashboard before publishing results.',
      href: '/staff/exams/internal?view=operations',
      count: pendingExamReports,
    })
  }

  return alerts
}

export const getDashboardAlerts = unstable_cache(compute, ['dashboard-alerts'], {
  revalidate: 300, // 5 minutes
  tags: [DASHBOARD_ALERTS_TAG],
})
