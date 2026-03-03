import prisma from '@/lib/prisma/client'
import { POOL_MAX_CANDIDATES, MODULE_DIVERSITY_CAP } from './types'
import { getWalletBalance } from '@/lib/wallet/balance'
import { calculatePoolSeatPrice } from './pricing'
import type { PoolValidationResult } from './types'

export async function validatePoolJoin(poolId: string, userId: string, examComponentId: string): Promise<PoolValidationResult> {
  // Check pool exists and is open
  const pool = await prisma.examPool.findUnique({
    where: { id: poolId },
    select: { id: true, status: true, currentMemberCount: true, maxCandidates: true, eventId: true },
  })
  if (!pool) return { valid: false, error: 'Pool not found' }
  if (!['OPEN', 'NEAR_FULL'].includes(pool.status)) return { valid: false, error: 'Pool is not accepting members' }
  if (pool.currentMemberCount >= POOL_MAX_CANDIDATES) return { valid: false, error: 'Pool is full' }

  // Check not already a member
  const existing = await prisma.poolMembership.findFirst({
    where: { poolId, userId, status: { in: ['RESERVED', 'CONFIRMED'] } },
  })
  if (existing) return { valid: false, error: 'You are already in this pool' }

  // Check module diversity cap — max 4 DISTINCT modules per pool
  const distinctModules = await prisma.poolMembership.findMany({
    where: { poolId, status: { in: ['RESERVED', 'CONFIRMED'] } },
    select: { examComponentId: true },
    distinct: ['examComponentId'],
  })
  const isNewModule = !distinctModules.some(m => m.examComponentId === examComponentId)
  if (isNewModule && distinctModules.length >= MODULE_DIVERSITY_CAP) {
    return { valid: false, error: `Pool already has ${MODULE_DIVERSITY_CAP} modules (maximum). Please choose from the existing modules in this pool.` }
  }

  // Check wallet balance using dynamic pricing (respects ambassador/multi-pool discounts)
  const priceCalc = await calculatePoolSeatPrice(userId, pool.eventId)
  const walletInfo = await getWalletBalance(userId)
  if (!walletInfo) return { valid: false, error: 'No wallet found. Contact staff.' }
  if (walletInfo.availableBalance < priceCalc.totalPrice) {
    return { valid: false, error: `Insufficient balance. Need €${priceCalc.totalPrice}, available €${walletInfo.availableBalance}` }
  }

  return { valid: true }
}
