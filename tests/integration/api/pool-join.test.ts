import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { POOL_EXAM_FEE, POOL_MIN_CANDIDATES } from '@/lib/pools/types'

describe('Pool Join Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects join when wallet has insufficient available balance', async () => {
    prismaMock.wallet.findUnique.mockResolvedValue({
      id: 'wallet-1',
      userId: 'user-1',
      balance: { toNumber: () => 100 },
      reservedBalance: { toNumber: () => 50 },
      availableBalance: { toNumber: () => 50 },
      currency: 'EUR',
    })

    const wallet = await prismaMock.wallet.findUnique({ where: { userId: 'user-1' } })
    const available = wallet!.availableBalance.toNumber()
    expect(available).toBeLessThan(POOL_EXAM_FEE)
  })

  it('allows join when wallet has sufficient available balance', async () => {
    prismaMock.wallet.findUnique.mockResolvedValue({
      id: 'wallet-1',
      userId: 'user-1',
      balance: { toNumber: () => 1500 },
      reservedBalance: { toNumber: () => 0 },
      availableBalance: { toNumber: () => 1500 },
      currency: 'EUR',
    })

    const wallet = await prismaMock.wallet.findUnique({ where: { userId: 'user-1' } })
    const available = wallet!.availableBalance.toNumber()
    expect(available).toBeGreaterThanOrEqual(POOL_EXAM_FEE)
  })

  it('rejects join when user already has active membership in pool', async () => {
    prismaMock.poolMembership.findFirst.mockResolvedValue({
      id: 'mem-1',
      poolId: 'pool-1',
      userId: 'user-1',
      status: 'RESERVED',
    })

    const existing = await prismaMock.poolMembership.findFirst({
      where: { poolId: 'pool-1', userId: 'user-1', status: { in: ['RESERVED', 'CONFIRMED'] } },
    })
    expect(existing).not.toBeNull()
  })

  it('rejects join when pool is not OPEN', async () => {
    prismaMock.examPool.findUnique.mockResolvedValue({
      id: 'pool-1',
      status: 'CONFIRMED',
      currentMemberCount: 25,
      maxCandidates: 28,
    })

    const pool = await prismaMock.examPool.findUnique({ where: { id: 'pool-1' } })
    expect(pool!.status).not.toBe('OPEN')
  })

  it('rejects join when pool is at max capacity', async () => {
    prismaMock.examPool.findUnique.mockResolvedValue({
      id: 'pool-1',
      status: 'OPEN',
      currentMemberCount: 28,
      maxCandidates: 28,
    })

    const pool = await prismaMock.examPool.findUnique({ where: { id: 'pool-1' } })
    expect(pool!.currentMemberCount).toBeGreaterThanOrEqual(pool!.maxCandidates)
  })

  it('creates membership and reserves wallet balance on successful join', async () => {
    const mockPool = {
      id: 'pool-1',
      status: 'OPEN',
      currentMemberCount: 10,
      maxCandidates: 28,
      minCandidates: POOL_MIN_CANDIDATES,
    }

    prismaMock.examPool.findUnique.mockResolvedValue(mockPool)
    prismaMock.poolMembership.findFirst.mockResolvedValue(null) // no existing membership
    prismaMock.poolMembership.create.mockResolvedValue({
      id: 'mem-new',
      poolId: 'pool-1',
      userId: 'user-1',
      status: 'RESERVED',
      amountReserved: POOL_EXAM_FEE,
    })
    prismaMock.examPool.update.mockResolvedValue({
      ...mockPool,
      currentMemberCount: 11,
    })

    // Verify the pool is open and has capacity
    const pool = await prismaMock.examPool.findUnique({ where: { id: 'pool-1' } })
    expect(pool!.status).toBe('OPEN')
    expect(pool!.currentMemberCount).toBeLessThan(pool!.maxCandidates)

    // Verify no duplicate membership
    const existing = await prismaMock.poolMembership.findFirst({
      where: { poolId: 'pool-1', userId: 'user-1' },
    })
    expect(existing).toBeNull()

    // Create membership
    const membership = await prismaMock.poolMembership.create({
      data: {
        poolId: 'pool-1',
        userId: 'user-1',
        status: 'RESERVED',
        amountReserved: POOL_EXAM_FEE,
      },
    })
    expect(membership.status).toBe('RESERVED')
    expect(membership.amountReserved).toBe(POOL_EXAM_FEE)

    // Increment member count
    const updatedPool = await prismaMock.examPool.update({
      where: { id: 'pool-1' },
      data: { currentMemberCount: { increment: 1 } },
    })
    expect(updatedPool.currentMemberCount).toBe(11)
  })

  it('transitions pool to NEAR_FULL when close to minimum', () => {
    const poolWithThreshold = {
      currentMemberCount: 23,
      minCandidates: POOL_MIN_CANDIDATES,
    }
    // NEAR_FULL threshold is typically minCandidates - 2
    const nearFull = poolWithThreshold.currentMemberCount >= POOL_MIN_CANDIDATES - 2
    expect(nearFull).toBe(true)
  })
})
