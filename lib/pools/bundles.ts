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
import { getExamPricingConfig } from './pricing-config'
import { placeExamBookingInStandardPool } from '@/lib/enrollment/exams'

export interface BundlePurchaseResult {
  success: boolean
  bundleId?: string
  error?: string
}

/**
 * Purchase a new exam seat bundle and auto-book into specific modules.
 */
export async function purchaseBundle(
  userId: string,
  bundleType: 'TWO_SEAT' | 'FOUR_SEAT',
  examComponentIds: string[]
): Promise<BundlePurchaseResult> {
  const pricing = await getExamPricingConfig()

  const seats = bundleType === 'TWO_SEAT' ? 2 : 4
  const price = bundleType === 'TWO_SEAT' ? pricing.twoSeatBundle : pricing.fourSeatBundle
  const freeChanges = bundleType === 'FOUR_SEAT' ? 2 : 1

  if (!examComponentIds || examComponentIds.length !== seats) {
    return { success: false, error: `Must provide exactly ${seats} modules.` }
  }

  // Find target event for these pools
  const activeEvent = await prisma.examEvent.findFirst({
    where: { status: { in: ['OPEN', 'DRAFT'] } },
    orderBy: { startDate: 'asc' },
  })

  if (!activeEvent) {
    return { success: false, error: 'No active upcoming Exam Events available to pool into.' }
  }

  // Pre-fetch the components to get module codes (course codes)
  const components = await prisma.examComponent.findMany({
    where: { id: { in: examComponentIds } },
    include: { course: true },
  })

  if (components.length !== examComponentIds.length) {
    return { success: false, error: 'One or more invalid modules selected.' }
  }

  try {
    const bundleBookingType = bundleType === 'TWO_SEAT' ? 'TWIN_PACK' as const : 'FOUR_PACK' as const

    const txResult = await prisma.$transaction(
      async (tx) => {
        // Check wallet balance
        const wallet = await tx.wallet.findUnique({ where: { userId } })
        if (!wallet) return { success: false, error: 'Wallet not found' }

        const available = Number(wallet.availableBalance)
        if (available < price) {
          return {
            success: false,
            error: `Insufficient balance. Need EUR ${price}, have EUR ${available}`,
          }
        }

        const purchaseRef = `BUNDLE-${userId.slice(-8)}-${Date.now()}`

        // Charge wallet for bundle price
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { decrement: price },
            availableBalance: { decrement: price },
          },
        })

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'PAYMENT',
            amount: price,
            description: `${bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'} Exam Bundle`,
            referenceType: 'BUNDLE_PURCHASE',
            referenceId: purchaseRef,
            balanceBefore: Number(wallet.balance),
            balanceAfter: Number(wallet.balance) - price,
            availableBefore: available,
            availableAfter: available - price,
          },
        })

        // Create bundle
        const validUntil = new Date()
        validUntil.setFullYear(validUntil.getFullYear() + 1)

        const bundle = await tx.examBundle.create({
          data: {
            userId,
            bundleType,
            totalSeats: seats,
            usedSeats: 0,
            status: 'ACTIVE',
            amountPaid: price,
            freeModuleChanges: freeChanges,
            // Audit 1c: Twin Pack = 1 free resit, Four Pack = 2 free resits.
            freeResitsIncluded: bundleType === 'FOUR_SEAT' ? 2 : 1,
            usedFreeResits: 0,
            validUntil,
          },
        })

        // Route each module through shared standard-pool assignment (cost = 0 since bundle covers it)
        for (const comp of components) {
          const courseCode = comp.course.code

          const result = await placeExamBookingInStandardPool(tx, {
            userId,
            eventId: activeEvent.id,
            examComponentId: comp.id,
            moduleCode: courseCode,
            bookingType: bundleBookingType,
            reserveAmount: 0,
            bundleId: bundle.id,
          })

          if (!result.success) {
            throw new Error(result.error || `Failed to place module ${courseCode}.`)
          }
        }

        return { success: true, bundleId: bundle.id }
      },
      {
        timeout: 20000,
      }
    )

    // Send bundle purchase confirmation email (outside transaction)
    if (txResult.success) {
      const { sendBundlePurchaseEmail } = await import('@/lib/email/service')
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, academyEmail: true, profile: { select: { firstName: true } } },
      })
      if (user) {
        const email = user.academyEmail || user.email
        const name = user.profile?.firstName || 'Student'
        const label = bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'
        sendBundlePurchaseEmail(email, name, label, seats, price).catch(console.error)
      }
    }

    return txResult
  } catch (err: unknown) {
    console.error('[BUNDLE PURCHASE ERROR]', err)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to purchase bundle' }
  }
}

/**
 * Find an available bundle seat for a pool join.
 * Returns the earliest-expiring active bundle with remaining seats, or null.
 */
export async function getAvailableBundle(userId: string) {
  // Prisma can't compare two columns (usedSeats < totalSeats) in findFirst,
  // so we fetch all active non-expired bundles and filter in JS
  const bundles = await prisma.examBundle.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      validUntil: { gt: new Date() },
    },
    orderBy: { validUntil: 'asc' }, // Use earliest expiring first
  })
  return bundles.find((b) => b.usedSeats < b.totalSeats) ?? null
}

/**
 * Use one seat from a bundle.
 */
export async function useBundleSeat(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], bundleId: string) {
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
