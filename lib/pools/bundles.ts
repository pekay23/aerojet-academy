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
  const freeChanges = bundleType === 'FOUR_SEAT' ? 1 : 0

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
    const txResult = await prisma.$transaction(
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
            description: `${bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'} Exam Bundle`,
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
            // Since all seats are immediately used by the selected modules
            usedSeats: seats,
            status: 'EXHAUSTED', // fully used up on purchase
            amountPaid: price,
            freeModuleChanges: freeChanges,
            validUntil,
          },
        })

        // Auto-assign into pools
        for (const comp of components) {
          const courseCode = comp.course.code

          // Prevent duplication in same event
          const duplicate = await tx.poolMembership.findFirst({
            where: {
              userId,
              pool: { eventId: activeEvent.id },
              examComponentId: comp.id,
              status: { in: ['RESERVED', 'CONFIRMED'] },
            },
          })
          if (duplicate) {
            throw new Error(`You are already booked for module ${courseCode}.`)
          }

          // Fetch open pools
          const matchingPools = await tx.examPool.findMany({
            where: {
              eventId: activeEvent.id,
              status: { in: ['OPEN', 'NEAR_FULL', 'CONFIRMED', 'DRAFT'] },
            },
          })

          let targetPool = null
          for (const pool of matchingPools) {
            if (pool.currentMemberCount >= pool.maxCandidates) continue
            if (pool.allowedModules.includes(courseCode)) {
              targetPool = pool
              break
            }
            if (pool.allowedModules.length < pool.moduleDiversityCap) {
              targetPool = pool
              break
            }
          }

          if (targetPool) {
            const newAllowed = [...targetPool.allowedModules]
            if (!newAllowed.includes(courseCode)) {
              newAllowed.push(courseCode)
            }
            await tx.examPool.update({
              where: { id: targetPool.id },
              data: {
                currentMemberCount: targetPool.currentMemberCount + 1,
                allowedModules: newAllowed,
                status:
                  targetPool.currentMemberCount + 1 >= targetPool.maxCandidates
                    ? 'NEAR_FULL'
                    : targetPool.status,
              },
            })
          } else {
            // Create New Pool
            const examStartTime = new Date(activeEvent.startDate)
            examStartTime.setHours(9, 0, 0, 0)
            const examEndTime = new Date(examStartTime.getTime() + comp.duration * 60000)

            targetPool = await tx.examPool.create({
              data: {
                eventId: activeEvent.id,
                name: `Auto Pool - ${courseCode}`,
                examDate: activeEvent.startDate,
                examStartTime,
                examEndTime,
                status: 'OPEN',
                currentMemberCount: 1,
                allowedModules: [courseCode],
                seatPrice: 300,
              },
            })
          }

          // Create PoolMembership
          await tx.poolMembership.create({
            data: {
              userId,
              poolId: targetPool.id,
              examComponentId: comp.id,
              status: 'CONFIRMED',
              amountReserved: 0,
              amountPaid: 0, // Paid via bundle
              discountType: 'BUNDLE',
            },
          })

          // Create ExamBooking
          await tx.examBooking.create({
            data: {
              userId,
              examComponentId: comp.id,
              bookingType: 'INDIVIDUAL', // Handled via pool internally
              moduleCode: courseCode,
              amountPaid: 0, // Paid via bundle
              status: 'APPROVED',
              examDate: targetPool.examDate,
            },
          })
        }

        // Upgrade role if needed
        const u = await tx.user.findUnique({ where: { id: userId } })
        if (u?.role === 'APPLICANT') {
          await tx.user.update({
            where: { id: userId },
            data: { role: 'STUDENT' },
          })
          await tx.studentProfile.update({
            where: { userId },
            data: { enrollmentStatus: 'ENROLLED' },
          })
        }

        return { success: true, bundleId: bundle.id }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
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
  } catch (err: any) {
    console.error('[BUNDLE PURCHASE ERROR]', err)
    return { success: false, error: err.message || 'Failed to purchase bundle' }
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
