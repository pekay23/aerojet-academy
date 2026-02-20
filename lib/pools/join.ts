import prisma from '@/lib/database/prisma'
import { Prisma } from '@prisma/client'
import { POOL_EXAM_FEE, POOL_MIN_CANDIDATES, POOL_NEAR_FULL_THRESHOLD } from './types'
import { confirmPoolInternal } from './confirm'
import type { PoolJoinInput, PoolJoinResult } from './types'

export async function joinPool({
  poolId,
  userId,
  selectedModule,
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

        // Reserve funds
        const wallet = await tx.wallet.findUnique({ where: { userId } })
        if (!wallet) return { success: false, error: 'No wallet' }
        const available = Number(wallet.balance) - Number(wallet.reservedBalance)
        if (available < POOL_EXAM_FEE) return { success: false, error: 'Insufficient balance' }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { reservedBalance: { increment: POOL_EXAM_FEE } },
        })

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'RESERVE',
            amount: POOL_EXAM_FEE,
            description: `Reserved for pool: ${pool.name}`,
            referenceId: `POOL-${poolId.substring(0, 8)}`,
            referenceType: 'POOL_RESERVATION',
            balanceBefore: Number(wallet.balance),
            balanceAfter: Number(wallet.balance),
          },
        })

        // Create membership
        const membership = await tx.poolMembership.create({
          data: {
            poolId,
            userId,
            selectedModule,
            status: 'RESERVED',
            amountReserved: POOL_EXAM_FEE,
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
