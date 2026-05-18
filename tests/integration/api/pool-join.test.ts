import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import {
  POOL_MAX_CANDIDATES,
  POOL_MIN_CANDIDATES,
  POOL_NEAR_FULL_THRESHOLD,
} from '@/lib/pools/types'

// Mock external dependencies that joinPoolInternal imports
vi.mock('@/lib/pools/assignment', () => ({
  resolveStandardPoolForJoin: vi.fn(),
}))
vi.mock('@/lib/wallet/operations', () => ({
  reserveFunds: vi.fn(),
  captureFunds: vi.fn(),
}))
vi.mock('@/lib/pools/confirm', () => ({
  confirmPoolInternal: vi.fn(),
}))
vi.mock('@/lib/pools/pricing', () => ({
  calculatePoolSeatPrice: vi.fn().mockResolvedValue({ totalPrice: 300 }),
}))
vi.mock('@/lib/pools/bundles', () => ({
  useBundleSeat: vi.fn(),
}))
vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn(),
  createAuditLog: vi.fn(),
  AuditAction: {},
}))
vi.mock('@/lib/email/service', () => ({
  sendPoolApproachingConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}))

import { joinPoolInternal } from '@/lib/pools/join'
import { resolveStandardPoolForJoin } from '@/lib/pools/assignment'
import type { PoolJoinInput } from '@/lib/pools/types'

const baseInput: PoolJoinInput = {
  poolId: 'pool-1',
  userId: 'user-1',
  examComponentId: 'comp-1',
  moduleCode: 'M01',
  eventId: 'event-1',
  bookingType: 'POOL',
  reserveAmount: 300,
}

const sourcePool = { id: 'pool-1', eventId: 'event-1', poolType: 'MANUAL' }

function makePool(overrides: Record<string, any> = {}) {
  return {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Test Pool',
    status: 'OPEN',
    currentMemberCount: 10,
    maxCandidates: POOL_MAX_CANDIDATES,
    minCandidates: POOL_MIN_CANDIDATES,
    examDate: new Date('2026-07-01'),
    examStartTime: null,
    examEndTime: null,
    seatPrice: 300,
    allowedModules: [],
    eventId: 'event-1',
    ...overrides,
  }
}

/** Set up the minimum mocks for a successful join */
function setupSuccessPath(poolOverrides: Record<string, any> = {}) {
  const pool = makePool(poolOverrides)

  // Source pool lookup
  prismaMock.examPool.findUnique.mockResolvedValueOnce(sourcePool as any)
  // resolveStandardPoolForJoin returns the pool id
  vi.mocked(resolveStandardPoolForJoin).mockResolvedValue(pool as any)
  // Resolved pool lookup
  prismaMock.examPool.findUnique.mockResolvedValueOnce(pool as any)
  // No existing membership
  prismaMock.poolMembership.findFirst.mockResolvedValueOnce(null)
  // Total pools count < max
  prismaMock.poolMembership.count.mockResolvedValueOnce(0)
  // No duplicate in event
  prismaMock.poolMembership.findFirst.mockResolvedValueOnce(null)
  // Student profile (enrolled student)
  prismaMock.studentProfile.findUnique.mockResolvedValueOnce({
    userId: 'user-1',
    enrollmentType: 'MODULAR',
    user: { id: 'user-1', role: 'STUDENT' },
  } as any)
  // Booking create
  prismaMock.examBooking.create.mockResolvedValueOnce({ id: 'booking-1' } as any)
  // Membership create
  prismaMock.poolMembership.create.mockResolvedValueOnce({
    id: 'mem-1',
    poolId: pool.id,
    userId: 'user-1',
    status: 'RESERVED',
    amountReserved: 300,
  } as any)
  // Pool update after join
  prismaMock.examPool.update.mockResolvedValueOnce({
    ...pool,
    currentMemberCount: pool.currentMemberCount + 1,
  } as any)

  return pool
}

describe('Pool Join — joinPoolInternal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when source pool is not found', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce(null)

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('rejects AUTO pool type', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce({
      ...sourcePool,
      poolType: 'AUTO',
    } as any)

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Cannot join auto pools')
  })

  it('rejects GROUP_CHARTER pool type', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce({
      ...sourcePool,
      poolType: 'GROUP_CHARTER',
    } as any)

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(false)
    expect(result.error).toContain('group booking representative')
  })

  it('rejects pool without eventId', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce({
      ...sourcePool,
      eventId: null,
    } as any)

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(false)
    expect(result.error).toContain('not attached to an exam event')
  })

  it('rejects when moduleCode is missing', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce(sourcePool as any)

    const result = await joinPoolInternal(prismaMock as any, {
      ...baseInput,
      moduleCode: undefined,
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Module code is required')
  })

  it('rejects when resolved pool is not in an open-like status', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce(sourcePool as any)
    vi.mocked(resolveStandardPoolForJoin).mockResolvedValue({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    } as any)
    prismaMock.examPool.findUnique.mockResolvedValueOnce(makePool({ status: 'FAILED' }) as any)

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(false)
    expect(result.error).toContain('not open')
  })

  it('rejects when pool is at max capacity', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce(sourcePool as any)
    vi.mocked(resolveStandardPoolForJoin).mockResolvedValue({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    } as any)
    prismaMock.examPool.findUnique.mockResolvedValueOnce(
      makePool({ currentMemberCount: POOL_MAX_CANDIDATES }) as any
    )

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(false)
    expect(result.error).toContain('full')
  })

  it('rejects duplicate membership in same pool', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce(sourcePool as any)
    vi.mocked(resolveStandardPoolForJoin).mockResolvedValue({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    } as any)
    prismaMock.examPool.findUnique.mockResolvedValueOnce(makePool() as any)
    // Existing membership found
    prismaMock.poolMembership.findFirst.mockResolvedValueOnce({
      id: 'existing-mem',
      status: 'RESERVED',
    } as any)

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(false)
    expect(result.error).toContain('already have a seat')
  })

  it('rejects when user has reached max total pools', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce(sourcePool as any)
    vi.mocked(resolveStandardPoolForJoin).mockResolvedValue({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    } as any)
    prismaMock.examPool.findUnique.mockResolvedValueOnce(makePool() as any)
    prismaMock.poolMembership.findFirst.mockResolvedValueOnce(null) // no existing
    prismaMock.poolMembership.count.mockResolvedValueOnce(4) // at max

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(false)
    expect(result.error).toContain('maximum of 4')
  })

  it('rejects full-time students from joining pools individually', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce(sourcePool as any)
    vi.mocked(resolveStandardPoolForJoin).mockResolvedValue({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    } as any)
    prismaMock.examPool.findUnique.mockResolvedValueOnce(makePool() as any)
    prismaMock.poolMembership.findFirst.mockResolvedValueOnce(null)
    prismaMock.poolMembership.count.mockResolvedValueOnce(0)
    prismaMock.poolMembership.findFirst.mockResolvedValueOnce(null) // no duplicate in event
    // Full-time student profile
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce({
      userId: 'user-1',
      enrollmentType: 'FULL_TIME',
      user: { id: 'user-1', role: 'STUDENT' },
    } as any)

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Full-Time students do not join')
  })

  it('succeeds for valid modular student and creates membership', async () => {
    setupSuccessPath()

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(true)
    expect(result.membership).toBeDefined()
    expect(result.booking).toBeDefined()
    // Verify membership was created
    expect(prismaMock.poolMembership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          poolId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          userId: 'user-1',
          examComponentId: 'comp-1',
        }),
      })
    )
  })

  it('triggers NEAR_FULL when count reaches threshold', async () => {
    setupSuccessPath({ currentMemberCount: POOL_NEAR_FULL_THRESHOLD - 1 })

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(true)
    expect(result.triggeredNearFull).toBe(true)
  })

  it('auto-confirms pool when min candidates reached', async () => {
    const { confirmPoolInternal } = await import('@/lib/pools/confirm')
    setupSuccessPath({ currentMemberCount: POOL_MIN_CANDIDATES - 1 })

    const result = await joinPoolInternal(prismaMock as any, baseInput)
    expect(result.success).toBe(true)
    expect(result.autoConfirmed).toBe(true)
    expect(confirmPoolInternal).toHaveBeenCalledWith(
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      prismaMock
    )
  })
})
