/**
 * Bundle Operations — Purchase and use exam seat bundles.
 *
 * Two-Seat Bundle: €980 (€490/seat vs €520 individual)
 * Four-Seat Bundle: €1,900 (€475/seat + 1 free module change)
 *
 * Bundles are valid for 12 months. Seats can be used for any module
 * in any pool during the validity period.
 */

import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { getExamPricingConfig } from './pricing-config'

export interface BundlePurchaseResult {
  success: boolean
  bundleId?: string
  error?: string
}

/**
 * Purchase a new exam seat bundle.
 */
export async function purchaseBundle(
  userId: string,
  bundleType: 'TWO_SEAT' | 'FOUR_SEAT'
): Promise<BundlePurchaseResult> {
  const pricing = await getExamPricingConfig()

  const seats = bundleType === 'TWO_SEAT' ? 2 : 4
  const price = bundleType === 'TWO_SEAT' ? pricing.twoSeatBundle : pricing.fourSeatBundle
  const freeChanges = bundleType === 'FOUR_SEAT' ? 1 : 0

  try {
    return await prisma.$transaction(
      async (tx) => {
        // Check wallet balance
        const wallet = await tx.wallet.findUnique({ where: { userId } })
        if (!wallet) return { success: false, error: 'Wallet not found' }

        const available = Number(wallet.availableBalance)
        if (available < price) {
          return {
            success: false,
            error: `Insufficient balance. Need €${price}, have €${available}`,
          }
        }

        // Charge wallet
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { decrement: price },
            availableBalance: { decrement: price },
          },
        })

        // Create transaction record
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'PAYMENT',
            amount: price,
            description: `${bundleType === 'TWO_SEAT' ? '2-Seat' : '4-Seat'} Exam Bundle`,
            referenceType: 'BUNDLE_PURCHASE',
            balanceBefore: Number(wallet.balance),
            balanceAfter: Number(wallet.balance) - price,
            availableBefore: available,
            availableAfter: available - price,
          },
        })

        // Create bundle
        const validUntil = new Date()
        validUntil.setFullYear(validUntil.getFullYear() + 1) // 12 months validity

        const bundle = await tx.examBundle.create({
          data: {
            userId,
            bundleType,
            totalSeats: seats,
            amountPaid: price,
            freeModuleChanges: freeChanges,
            validUntil,
          },
        })

        return { success: true, bundleId: bundle.id }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )
  } catch (err: any) {
    console.error('[BUNDLE PURCHASE ERROR]', err)
    return { success: false, error: err.message || 'Failed to purchase bundle' }
  }
}

/**
 * Use a bundle seat for a pool join. Returns the bundle if one is available.
 */
export async function getAvailableBundle(userId: string) {
  return prisma.examBundle.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      validUntil: { gt: new Date() },
      usedSeats: { lt: prisma.examBundle.fields.totalSeats as any },
    },
    orderBy: { validUntil: 'asc' }, // Use earliest expiring first
  })
}

/**
 * Use one seat from a bundle.
 */
export async function useBundleSeat(tx: any, bundleId: string) {
  const bundle = await tx.examBundle.findUnique({ where: { id: bundleId } })
  if (!bundle) throw new Error('Bundle not found')
  if (bundle.usedSeats >= bundle.totalSeats) throw new Error('Bundle exhausted')
  if (bundle.validUntil < new Date()) throw new Error('Bundle expired')

  const newUsedSeats = bundle.usedSeats + 1
  const newStatus = newUsedSeats >= bundle.totalSeats ? 'EXHAUSTED' : 'ACTIVE'

  return tx.examBundle.update({
    where: { id: bundleId },
    data: {
      usedSeats: newUsedSeats,
      status: newStatus,
    },
  })
}

/**
 * Get all bundles for a user with usage info.
 */
export async function getUserBundles(userId: string) {
  return prisma.examBundle.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}
