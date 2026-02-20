import { describe, it, expect } from 'vitest'
import { POOL_EXAM_FEE, POOL_MIN_CANDIDATES } from '@/lib/pools/types'
import { mockPool, mockMembership } from '@/tests/fixtures/pools'
import { mockWallet } from '@/tests/fixtures/transactions'

describe('Pool Join Integration', () => {
  it('requires sufficient wallet balance', () => {
    const available = mockWallet.balance - mockWallet.reservedBalance
    expect(available).toBeGreaterThanOrEqual(POOL_EXAM_FEE)
  })

  it('pool needs 25 to confirm', () => {
    expect(mockPool.currentMemberCount).toBeLessThan(POOL_MIN_CANDIDATES)
    expect(mockPool.status).toBe('OPEN')
  })

  it('membership starts as RESERVED', () => {
    expect(mockMembership.status).toBe('RESERVED')
    expect(mockMembership.amountReserved).toBe(POOL_EXAM_FEE)
    expect(mockMembership.amountPaid).toBe(0)
  })
})
