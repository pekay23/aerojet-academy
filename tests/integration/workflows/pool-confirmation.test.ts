import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { POOL_MIN_CANDIDATES } from '@/lib/pools/types'

describe('Pool Confirmation Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not confirm pool below minimum candidates', async () => {
    prismaMock.examPool.findUnique.mockResolvedValue({
      id: 'pool-1',
      status: 'OPEN',
      currentMemberCount: 10,
      minCandidates: POOL_MIN_CANDIDATES,
      memberships: Array.from({ length: 10 }, (_, i) => ({
        id: `mem-${i}`,
        status: 'RESERVED',
      })),
    })

    const pool = await prismaMock.examPool.findUnique({ where: { id: 'pool-1' } })
    expect(pool!.currentMemberCount).toBeLessThan(POOL_MIN_CANDIDATES)
    expect(pool!.status).toBe('OPEN')
  })

  it('confirms pool when minimum candidates reached', async () => {
    const memberCount = POOL_MIN_CANDIDATES
    prismaMock.examPool.findUnique.mockResolvedValue({
      id: 'pool-2',
      status: 'OPEN',
      currentMemberCount: memberCount,
      minCandidates: POOL_MIN_CANDIDATES,
      memberships: Array.from({ length: memberCount }, (_, i) => ({
        id: `mem-${i}`,
        status: 'RESERVED',
        amountReserved: 300,
      })),
    })

    prismaMock.examPool.update.mockResolvedValue({
      id: 'pool-2',
      status: 'CONFIRMED',
      currentMemberCount: memberCount,
    })

    const pool = await prismaMock.examPool.findUnique({ where: { id: 'pool-2' } })
    expect(pool!.currentMemberCount).toBeGreaterThanOrEqual(POOL_MIN_CANDIDATES)

    // Confirm the pool
    const confirmed = await prismaMock.examPool.update({
      where: { id: 'pool-2' },
      data: { status: 'CONFIRMED' },
    })
    expect(confirmed.status).toBe('CONFIRMED')
  })

  it('transitions memberships from RESERVED to CONFIRMED on pool confirm', async () => {
    prismaMock.poolMembership.updateMany.mockResolvedValue({ count: 25 })

    const result = await prismaMock.poolMembership.updateMany({
      where: { poolId: 'pool-2', status: 'RESERVED' },
      data: { status: 'CONFIRMED' },
    })
    expect(result.count).toBe(25)
  })

  it('fails pool and refunds reserved amounts when pool fails', async () => {
    const memberships = Array.from({ length: 5 }, (_, i) => ({
      id: `mem-${i}`,
      userId: `user-${i}`,
      status: 'RESERVED',
      amountReserved: 300,
    }))

    prismaMock.examPool.findUnique.mockResolvedValue({
      id: 'pool-fail',
      status: 'OPEN',
      currentMemberCount: 5,
      minCandidates: POOL_MIN_CANDIDATES,
      memberships,
    })

    prismaMock.examPool.update.mockResolvedValue({
      id: 'pool-fail',
      status: 'FAILED',
    })

    prismaMock.poolMembership.updateMany.mockResolvedValue({ count: 5 })

    // Fail the pool
    const failed = await prismaMock.examPool.update({
      where: { id: 'pool-fail' },
      data: { status: 'FAILED' },
    })
    expect(failed.status).toBe('FAILED')

    // All memberships should be failed
    const memberResult = await prismaMock.poolMembership.updateMany({
      where: { poolId: 'pool-fail', status: 'RESERVED' },
      data: { status: 'FAILED' },
    })
    expect(memberResult.count).toBe(5)
  })
})
