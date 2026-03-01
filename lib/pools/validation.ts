import prisma from '@/lib/prisma/client'
import { POOL_MAX_CANDIDATES, MODULE_DIVERSITY_CAP, POOL_EXAM_FEE } from './types'
import { getWalletBalance } from '@/lib/wallet/balance'
import type { PoolValidationResult } from './types'

export async function validatePoolJoin(poolId: string, userId: string, examComponentId: string): Promise<PoolValidationResult> {
  // Check pool exists and is open
  const pool = await prisma.examPool.findUnique({ where: { id: poolId } })
  if (!pool) return { valid: false, error: 'Pool not found' }
  if (!['OPEN', 'NEAR_FULL'].includes(pool.status)) return { valid: false, error: 'Pool is not accepting members' }
  if (pool.currentMemberCount >= POOL_MAX_CANDIDATES) return { valid: false, error: 'Pool is full' }

  // Check not already a member
  const existing = await prisma.poolMembership.findFirst({
    where: { poolId, userId, status: { in: ['RESERVED', 'CONFIRMED'] } },
  })
  if (existing) return { valid: false, error: 'You are already in this pool' }

  // Check module diversity cap
  const moduleCount = await prisma.poolMembership.count({
    where: { poolId, examComponentId, status: { in: ['RESERVED', 'CONFIRMED'] } },
  })
  if (moduleCount >= MODULE_DIVERSITY_CAP) return { valid: false, error: `Module has reached the diversity cap (${MODULE_DIVERSITY_CAP})` }

  // Check wallet balance
  const walletInfo = await getWalletBalance(userId)
  if (!walletInfo) return { valid: false, error: 'No wallet found. Contact staff.' }
  if (walletInfo.availableBalance < POOL_EXAM_FEE) return { valid: false, error: `Insufficient balance. Need €${POOL_EXAM_FEE}, available €${walletInfo.availableBalance}` }

  return { valid: true }
}
