import prisma from '@/lib/prisma/client'
import { getWalletBalance } from '@/lib/wallet/balance'
import { calculatePoolSeatPrice } from './pricing'
import type { PoolValidationResult } from './types'
import { ACTIVE_MEMBERSHIP_STATUSES } from '@/lib/utils/constants'

export async function validatePoolJoin(
  poolId: string,
  userId: string,
  _examComponentId: string
): Promise<PoolValidationResult> {
  const pool = await prisma.examPool.findUnique({
    where: { id: poolId },
    select: { id: true, status: true, poolType: true, eventId: true },
  })
  if (!pool) return { valid: false, error: 'Pool not found' }
  if (pool.poolType === 'AUTO') return { valid: false, error: 'Cannot join auto pools directly' }
  if (pool.poolType === 'GROUP_CHARTER') {
    return { valid: false, error: 'Group charter pools require staff handling' }
  }
  if (!pool.eventId) return { valid: false, error: 'Pool is not attached to an exam event' }
  if (!['OPEN', 'NEAR_FULL', 'DRAFT'].includes(pool.status)) {
    return { valid: false, error: 'Pool is not accepting members' }
  }

  const existing = await prisma.poolMembership.findFirst({
    where: { poolId, userId, status: { in: ACTIVE_MEMBERSHIP_STATUSES } },
  })
  if (existing) return { valid: false, error: 'You are already in this pool' }

  const priceCalc = await calculatePoolSeatPrice(userId, pool.eventId)
  const walletInfo = await getWalletBalance(userId)
  if (!walletInfo) return { valid: false, error: 'No wallet found. Contact staff.' }
  if (walletInfo.availableBalance < priceCalc.totalPrice) {
    return {
      valid: false,
      error: `Insufficient balance. Need EUR ${priceCalc.totalPrice}, available EUR ${walletInfo.availableBalance}`,
    }
  }

  return { valid: true }
}
