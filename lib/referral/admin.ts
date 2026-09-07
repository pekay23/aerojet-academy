/**
 * A.5.c — Staff/admin tooling on top of lib/referral/operations.ts.
 *
 * Adds: fraud heuristics, manual disqualification, ambassador revoke,
 * payout batch creation, CSV export.
 *
 * Gated by `MANAGE_REFERRALS` permission key at the route layer.
 */

import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'

/** Fraud-score bumps — sum into final fraudScore. */
const FRAUD_WEIGHTS = {
  SAME_IP_HASH: 30,
  SAME_UA_HASH: 20,
  SAME_EMAIL_DOMAIN: 10,
  BURST_24H: 40,
  REFERRER_SELF_DOMAIN: 15,
}

interface FraudOutcome {
  referralId: string
  added: string[]
  newScore: number
}

/**
 * Scan recent referrals and stamp `fraudScore` + `fraudReasons` based on
 * cheap heuristics. Idempotent — running twice produces the same result for
 * the same input population.
 *
 * @param sinceDays look at referrals created in the last N days (default 7)
 */
export async function runFraudHeuristics(sinceDays = 7): Promise<{
  scanned: number
  flagged: number
  outcomes: FraudOutcome[]
}> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
  const referrals = await prismaUnfiltered.referral.findMany({
    where: { createdAt: { gte: since } },
    include: {
      referrer: { select: { id: true, email: true } },
      referee: { select: { id: true, email: true, createdAt: true } },
    },
  })

  const outcomes: FraudOutcome[] = []
  let flagged = 0

  for (const r of referrals) {
    const reasons = new Set<string>(r.fraudReasons ?? [])
    let score = 0

    // 1) Burst: 3+ referrals from same referrer in 24h around this referee's signup
    const refereeAt = r.referee.createdAt.getTime()
    const windowStart = new Date(refereeAt - 24 * 60 * 60 * 1000)
    const windowEnd = new Date(refereeAt + 24 * 60 * 60 * 1000)
    const burst = await prismaUnfiltered.referral.count({
      where: {
        referrerId: r.referrerId,
        createdAt: { gte: windowStart, lte: windowEnd },
      },
    })
    if (burst >= 3) {
      reasons.add('BURST_24H')
      score += FRAUD_WEIGHTS.BURST_24H
    }

    // 2) Same email domain referrer ↔ referee
    const refDomain = r.referrer.email.split('@')[1]?.toLowerCase() ?? ''
    const refeDomain = r.referee.email.split('@')[1]?.toLowerCase() ?? ''
    if (refDomain && refDomain === refeDomain) {
      reasons.add('SAME_EMAIL_DOMAIN')
      score += FRAUD_WEIGHTS.SAME_EMAIL_DOMAIN
    }

    // 3) IP / UA collisions: if we have signup hashes recorded on Referral
    if (r.signupIpHash) {
      const ipMatches = await prismaUnfiltered.referral.count({
        where: { signupIpHash: r.signupIpHash, id: { not: r.id } },
      })
      if (ipMatches > 0) {
        reasons.add('SAME_IP_HASH')
        score += FRAUD_WEIGHTS.SAME_IP_HASH
      }
    }
    if (r.signupUaHash) {
      const uaMatches = await prismaUnfiltered.referral.count({
        where: { signupUaHash: r.signupUaHash, id: { not: r.id } },
      })
      if (uaMatches > 0) {
        reasons.add('SAME_UA_HASH')
        score += FRAUD_WEIGHTS.SAME_UA_HASH
      }
    }

    if (score !== r.fraudScore || reasons.size !== (r.fraudReasons?.length ?? 0)) {
      await prismaUnfiltered.referral.update({
        where: { id: r.id },
        data: { fraudScore: score, fraudReasons: Array.from(reasons) },
      })
    }
    if (score >= 30) flagged += 1
    outcomes.push({
      referralId: r.id,
      added: Array.from(reasons),
      newScore: score,
    })
  }

  return { scanned: referrals.length, flagged, outcomes }
}

/**
 * Manually disqualify a referral. Reverses the qualification side-effects:
 * decrements `successfulReferrals` and, if the referrer just lost ambassador
 * status, optionally revokes ambassador.
 */
export async function disqualifyReferral(
  referralId: string,
  actorId: string,
  reason: string
): Promise<void> {
  await prismaUnfiltered.$transaction(async (tx) => {
    const r = await tx.referral.findUnique({ where: { id: referralId } })
    if (!r) throw new Error('Referral not found')
    if (r.status === 'DISQUALIFIED') return

    await tx.referral.update({
      where: { id: referralId },
      data: {
        status: 'DISQUALIFIED',
        reviewedById: actorId,
        reviewedAt: new Date(),
        fraudReasons: Array.from(new Set([...(r.fraudReasons ?? []), 'STAFF_REVIEW'])),
      },
    })

    if (r.status === 'QUALIFIED') {
      await tx.user.update({
        where: { id: r.referrerId },
        data: { successfulReferrals: { decrement: 1 } },
      })
    }
  })

  await createAuditLog({
    userId: actorId,
    action: 'UPDATE',
    entity: 'Referral',
    entityId: referralId,
    description: `Referral disqualified: ${reason}`,
    changes: { after: { status: 'DISQUALIFIED', reason } },
  })
}

/** Revoke ambassador status — useful when fraud cluster found. */
export async function revokeAmbassador(
  userId: string,
  actorId: string,
  reason: string
): Promise<void> {
  await prismaUnfiltered.user.update({
    where: { id: userId },
    data: { isAmbassador: false },
  })
  await createAuditLog({
    userId: actorId,
    action: 'UPDATE',
    entity: 'User',
    entityId: userId,
    description: `Ambassador status revoked: ${reason}`,
    changes: { after: { isAmbassador: false } },
  })
}

/**
 * Create a payout run covering [periodStart, periodEnd]. Aggregates each
 * referrer's qualified-and-not-yet-paid referrals into a single
 * `ReferralPayout` row, valued at `pricing.ambassadorPayoutPerReferral`
 * (falls back to 25 EUR if not configured).
 *
 * Returns the number of payout rows created.
 */
export async function createPayoutRun(
  periodStart: Date,
  periodEnd: Date,
  actorId: string
): Promise<{ created: number }> {
  const pricing = await getExamPricingConfig().catch(() => ({ ambassadorCredit: 25 } as unknown as { ambassadorCredit: number }))
  const perReferral: number = pricing?.ambassadorCredit ?? 25

  const qualified = await prismaUnfiltered.referral.findMany({
    where: {
      status: 'QUALIFIED',
      qualifiedAt: { gte: periodStart, lte: periodEnd },
    },
    select: { referrerId: true },
  })

  const counts = new Map<string, number>()
  for (const q of qualified) {
    counts.set(q.referrerId, (counts.get(q.referrerId) ?? 0) + 1)
  }

  let created = 0
  for (const [referrerId, count] of counts) {
    const amount = new Prisma.Decimal(count * perReferral)
    await prismaUnfiltered.referralPayout.create({
      data: {
        referrerId,
        amount,
        currency: 'EUR',
        periodStart,
        periodEnd,
        status: 'PENDING',
      },
    })
    created += 1
  }

  await createAuditLog({
    userId: actorId,
    action: 'CREATE',
    entity: 'ReferralPayout',
    entityId: `run:${periodStart.toISOString()}..${periodEnd.toISOString()}`,
    description: `Payout run created — ${created} payouts`,
    changes: { period: { periodStart, periodEnd }, count: created, perReferral },
  })
  return { created }
}

/** Return a CSV string for a set of payouts (or all PENDING if no IDs). */
export async function exportPayoutCsv(payoutIds?: string[]): Promise<string> {
  const payouts = await prismaUnfiltered.referralPayout.findMany({
    where: payoutIds && payoutIds.length > 0 ? { id: { in: payoutIds } } : { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  })

  // Need referrer details for the CSV (email, bank-ref placeholder)
  const referrerIds = Array.from(new Set(payouts.map((p) => p.referrerId)))
  const users = await prismaUnfiltered.user.findMany({
    where: { id: { in: referrerIds } },
    select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  const header = ['payoutId', 'referrerId', 'name', 'email', 'amount', 'currency', 'periodStart', 'periodEnd', 'status']
  const rows = payouts.map((p) => {
    const u = userMap.get(p.referrerId)
    const name = u?.profile ? `${u.profile.firstName} ${u.profile.lastName}` : ''
    return [
      p.id,
      p.referrerId,
      name,
      u?.email ?? '',
      String(p.amount),
      p.currency,
      p.periodStart.toISOString(),
      p.periodEnd.toISOString(),
      p.status,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
  })
  return [header.join(','), ...rows].join('\n')
}
