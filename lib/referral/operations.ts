/**
 * Referral & Ambassador System
 *
 * RULES:
 * - Each user gets a unique referralCode on first request
 * - When a referee registers + pays registration fee → referral qualifies
 * - 10+ qualified referrals → user auto-promoted to Ambassador
 * - Ambassador gets €100 wallet credit + lifetime discounted pool seat (€270)
 * - Ambassador pricing is already handled in lib/pools/pricing.ts
 */

import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'

const AMBASSADOR_THRESHOLD = 10

/**
 * Generate or retrieve a user's referral code.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, email: true },
  })
  if (!user) throw new Error('User not found')

  if (user.referralCode) return user.referralCode

  // Generate a short, unique code
  const prefix = 'AERO'
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  const code = `${prefix}-${randomPart}`

  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code },
  })

  return code
}

/**
 * Record a referral when a new user registers with a referral code.
 * Called during registration flow.
 */
export async function recordReferral(
  referralCode: string,
  refereeId: string
): Promise<{ success: boolean; error?: string }> {
  const referrer = await prisma.user.findFirst({
    where: { referralCode: referralCode },
    select: { id: true, role: true },
  })

  if (!referrer) return { success: false, error: 'Invalid referral code' }
  if (referrer.role !== 'STUDENT') return { success: false, error: 'Only students can be referrers' }
  if (referrer.id === refereeId) return { success: false, error: 'Cannot refer yourself' }

  // Check if already referred
  const existing = await prisma.referral.findUnique({
    where: {
      referrerId_refereeId: { referrerId: referrer.id, refereeId },
    },
  })
  if (existing) return { success: false, error: 'Referral already recorded' }

  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      refereeId,
      status: 'PENDING',
    },
  })

  return { success: true }
}

/**
 * Qualify a referral when the referee pays their registration fee.
 * Also checks if the referrer has reached Ambassador threshold.
 */
export async function qualifyReferral(refereeId: string): Promise<void> {
  const referral = await prisma.referral.findFirst({
    where: { refereeId, status: 'PENDING' },
  })

  if (!referral) return // No pending referral for this user

  await prisma.$transaction(
    async (tx) => {
      // Mark referral as qualified
      await tx.referral.update({
        where: { id: referral.id },
        data: { status: 'QUALIFIED', qualifiedAt: new Date() },
      })

      // Increment referrer's successful referral count
      const referrer = await tx.user.update({
        where: { id: referral.referrerId },
        data: { successfulReferrals: { increment: 1 } },
      })

      // Check if referrer has reached Ambassador threshold
      if (referrer.successfulReferrals >= AMBASSADOR_THRESHOLD && !referrer.isAmbassador) {
        await promoteToAmbassador(tx, referrer.id)
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}

/**
 * Promote a user to Ambassador status and credit their wallet.
 */
async function promoteToAmbassador(tx: any, userId: string) {
  const pricing = await getExamPricingConfig()

  // Set ambassador flag
  await tx.user.update({
    where: { id: userId },
    data: { isAmbassador: true },
  })

  // Credit wallet with ambassador bonus
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (wallet) {
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: { increment: pricing.ambassadorCredit },
        availableBalance: { increment: pricing.ambassadorCredit },
      },
    })

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount: pricing.ambassadorCredit,
        description: `Ambassador status achieved. EUR ${pricing.ambassadorCredit} bonus credited.`,
        referenceType: 'AMBASSADOR_BONUS',
        referenceId: `AMBASSADOR-${userId}`,
        balanceBefore: Number(wallet.balance),
        balanceAfter: Number(wallet.balance) + pricing.ambassadorCredit,
        availableBefore: Number(wallet.availableBalance),
        availableAfter: Number(wallet.availableBalance) + pricing.ambassadorCredit,
      },
    })
  }

  // Send ambassador promotion email (outside the calling transaction scope, fire-and-forget)
  import('@/lib/email/service').then(async ({ sendAmbassadorPromotionEmail }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, academyEmail: true, profile: { select: { firstName: true } } },
    })
    if (user) {
      const email = user.academyEmail || user.email
      const name = user.profile?.firstName || 'Student'
      sendAmbassadorPromotionEmail(email, name, pricing.ambassadorCredit).catch(console.error)
    }
  }).catch(console.error)
}

/**
 * Get referral stats for a user (for dashboard display).
 */
export async function getReferralStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      isAmbassador: true,
      successfulReferrals: true,
    },
  })

  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referee: {
        select: {
          profile: { select: { firstName: true, lastName: true } },
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    referralCode: user?.referralCode,
    isAmbassador: user?.isAmbassador ?? false,
    totalReferrals: referrals.length,
    qualifiedReferrals: user?.successfulReferrals ?? 0,
    pendingReferrals: referrals.filter((r) => r.status === 'PENDING').length,
    progressToAmbassador: Math.min(
      100,
      Math.round(((user?.successfulReferrals ?? 0) / AMBASSADOR_THRESHOLD) * 100)
    ),
    remainingForAmbassador: Math.max(0, AMBASSADOR_THRESHOLD - (user?.successfulReferrals ?? 0)),
    referrals: referrals.map((r) => ({
      id: r.id,
      refereeName: r.referee.profile
        ? `${r.referee.profile.firstName} ${r.referee.profile.lastName?.[0]}.`
        : 'Unknown',
      status: r.status,
      qualifiedAt: r.qualifiedAt,
      createdAt: r.createdAt,
    })),
  }
}
