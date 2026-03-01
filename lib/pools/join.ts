import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { POOL_EXAM_FEE, POOL_MIN_CANDIDATES, POOL_NEAR_FULL_THRESHOLD } from './types'
import { confirmPoolInternal } from './confirm'
import type { PoolJoinInput, PoolJoinResult } from './types'

export async function joinPool({
  poolId,
  userId,
  examComponentId,
}: PoolJoinInput): Promise<PoolJoinResult> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        // Lock pool row
        const [pool] = await tx.$queryRawUnsafe<any[]>(
          `SELECT * FROM "ExamPool" WHERE id = $1 FOR UPDATE`,
          poolId
        )
        if (!pool) return { success: false, error: 'Pool not found' }
        if (!['OPEN', 'NEAR_FULL'].includes(pool.status))
          return { success: false, error: 'Pool is not open' }
        if (pool.currentMemberCount >= 28) return { success: false, error: 'Pool is full' }

        // 0. Pathway/Enrollment Check
        const profile = await tx.studentProfile.findUnique({
          where: { userId },
          include: { user: true },
        })

        if (!profile) return { success: false, error: 'Student profile not found' }

        // Full-time students follow milestones (except resits, which might be standalone)
        if (profile.enrollmentType === 'FULL_TIME') {
          // check if this is a resit. If not, block.
          // For now, let's assume pools are NOT for FT students as per user feedback.
          return {
            success: false,
            error:
              'Full-Time students follow a strictly milestone-based path and do not join exam pools individually.',
          }
        }

        // Check if Modular student has already paid for this module
        let feeToReserve = POOL_EXAM_FEE
        if (profile.enrollmentType === 'MODULAR') {
          const modularEnrollment = await tx.modularEnrollment.findFirst({
            where: {
              studentId: userId,
              status: 'ACTIVE',
              package: { modulesIncluded: { has: examComponentId } },
            },
          })

          if (modularEnrollment) {
            feeToReserve = 0 // Included in package
          }
        }

        // Reserve funds (if fee > 0)
        const wallet = await tx.wallet.findUnique({ where: { userId } })
        if (!wallet) return { success: false, error: 'No wallet' }

        if (feeToReserve > 0) {
          const available = Number(wallet.balance) - Number(wallet.reservedBalance)
          if (available < feeToReserve) return { success: false, error: 'Insufficient balance' }

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { reservedBalance: { increment: feeToReserve } },
          })

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'RESERVE',
              amount: feeToReserve,
              description: `Reserved for pool: ${pool.name}`,
              referenceId: `POOL-${poolId.substring(0, 8)}`,
              referenceType: 'POOL_RESERVATION',
              balanceBefore: Number(wallet.balance) - Number(wallet.reservedBalance),
              balanceAfter: Number(wallet.balance) - Number(wallet.reservedBalance) - feeToReserve,
            },
          })
        }

        // Create membership
        const membership = await tx.poolMembership.create({
          data: {
            poolId,
            userId,
            examComponentId,
            status: feeToReserve > 0 ? 'RESERVED' : 'CONFIRMED',
            amountReserved: feeToReserve,
            amountPaid: 0,
          },
        })

        const newCount = pool.currentMemberCount + 1
        const newStatus =
          newCount >= POOL_MIN_CANDIDATES
            ? 'CONFIRMED'
            : newCount >= POOL_NEAR_FULL_THRESHOLD
              ? 'NEAR_FULL'
              : pool.status

        await tx.examPool.update({
          where: { id: poolId },
          data: { currentMemberCount: newCount, status: newStatus },
        })

        // Auto-confirm if reached minimum
        let autoConfirmed = false
        if (newCount >= POOL_MIN_CANDIDATES && pool.status !== 'CONFIRMED') {
          await confirmPoolInternal(poolId, tx)
          autoConfirmed = true
        }

        return { success: true, membership, autoConfirmed }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )
  } catch (err: any) {
    console.error('[POOL JOIN ERROR]', err)
    return { success: false, error: err.message || 'Failed to join pool' }
  }
}
