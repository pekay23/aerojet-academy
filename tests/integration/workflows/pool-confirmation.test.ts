import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { POOL_MIN_CANDIDATES } from '@/lib/pools/types'

// Mock external dependencies
vi.mock('@/lib/wallet/operations', () => ({
  captureFunds: vi.fn(),
  releaseFunds: vi.fn(),
}))
vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn(),
  createAuditLog: vi.fn(),
  AuditAction: {},
}))
vi.mock('@/lib/email/service', () => ({
  sendPoolConfirmedEmail: vi.fn().mockResolvedValue(undefined),
  sendPoolFailedEmail: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
}))

import { confirmPoolInternal, failPool } from '@/lib/pools/confirm'
import { captureFunds, releaseFunds } from '@/lib/wallet/operations'
import { sendPoolConfirmedEmail, sendPoolFailedEmail } from '@/lib/email/service'

function makeMembership(i: number, overrides: Record<string, any> = {}) {
  return {
    id: `mem-${i}`,
    userId: `user-${i}`,
    bookingId: `booking-${i}`,
    status: 'RESERVED',
    amountReserved: 300,
    amountPaid: 0,
    user: {
      id: `user-${i}`,
      email: `user${i}@test.com`,
      academyEmail: null,
      profile: { firstName: `Student${i}` },
    },
    examComponent: { course: { code: 'M01' } },
    ...overrides,
  }
}

const pool = {
  id: 'pool-1',
  name: 'Test Pool Jan 2027',
  status: 'OPEN',
  currentMemberCount: POOL_MIN_CANDIDATES,
  maxCandidates: 28,
  seatPrice: 300,
  examDate: new Date('2027-01-15'),
}

describe('Pool Confirmation — confirmPoolInternal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('captures funds for every RESERVED membership and marks them CONFIRMED', async () => {
    const memberships = [makeMembership(1), makeMembership(2), makeMembership(3)]

    prismaMock.poolMembership.findMany.mockResolvedValueOnce(memberships as any)
    prismaMock.examPool.findUnique.mockResolvedValueOnce(pool as any) // first call in confirmPoolInternal
    prismaMock.poolMembership.update.mockResolvedValue({} as any)
    prismaMock.examBooking.update.mockResolvedValue({} as any)
    // Second findUnique for final status check
    prismaMock.examPool.findUnique.mockResolvedValueOnce(pool as any)
    prismaMock.examPool.update.mockResolvedValue({} as any)

    await confirmPoolInternal('pool-1', prismaMock as any)

    // captureFunds called once per membership
    expect(captureFunds).toHaveBeenCalledTimes(3)
    for (let i = 1; i <= 3; i++) {
      expect(captureFunds).toHaveBeenCalledWith(
        prismaMock,
        `user-${i}`,
        300,
        expect.stringContaining('Exam fee captured'),
        `booking-${i}`,
        'EXAM_BOOKING'
      )
    }

    // Each membership updated to CONFIRMED
    expect(prismaMock.poolMembership.update).toHaveBeenCalledTimes(3)
    expect(prismaMock.poolMembership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CONFIRMED' }),
      })
    )

    // Pool status set to CONFIRMED (not LOCKED since count < max)
    expect(prismaMock.examPool.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pool-1' },
        data: expect.objectContaining({ status: 'CONFIRMED' }),
      })
    )

    // Confirmation emails sent
    expect(sendPoolConfirmedEmail).toHaveBeenCalledTimes(3)
  })

  it('sets pool status to LOCKED when at max capacity', async () => {
    const fullPool = { ...pool, currentMemberCount: 28, maxCandidates: 28 }
    prismaMock.poolMembership.findMany.mockResolvedValueOnce([makeMembership(1)] as any)
    prismaMock.examPool.findUnique.mockResolvedValueOnce(fullPool as any)
    prismaMock.poolMembership.update.mockResolvedValue({} as any)
    prismaMock.examBooking.update.mockResolvedValue({} as any)
    // Second findUnique returns pool at max
    prismaMock.examPool.findUnique.mockResolvedValueOnce(fullPool as any)
    prismaMock.examPool.update.mockResolvedValue({} as any)

    await confirmPoolInternal('pool-1', prismaMock as any)

    expect(prismaMock.examPool.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'LOCKED' }),
      })
    )
  })

  it('updates associated exam bookings to APPROVED on confirmation', async () => {
    prismaMock.poolMembership.findMany.mockResolvedValueOnce([makeMembership(1)] as any)
    prismaMock.examPool.findUnique
      .mockResolvedValueOnce(pool as any)
      .mockResolvedValueOnce(pool as any)
    prismaMock.poolMembership.update.mockResolvedValue({} as any)
    prismaMock.examBooking.update.mockResolvedValue({} as any)
    prismaMock.examPool.update.mockResolvedValue({} as any)

    await confirmPoolInternal('pool-1', prismaMock as any)

    expect(prismaMock.examBooking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-1' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      })
    )
  })
})

describe('Pool Failure — failPool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('releases funds for RESERVED memberships and cancels them', async () => {
    const memberships = [makeMembership(1), makeMembership(2)]

    prismaMock.examPool.findUnique.mockResolvedValueOnce(pool as any)
    prismaMock.poolMembership.findMany.mockResolvedValueOnce(memberships as any)
    prismaMock.poolMembership.update.mockResolvedValue({} as any)
    prismaMock.examBooking.update.mockResolvedValue({} as any)
    prismaMock.examPool.update.mockResolvedValue({} as any)

    await failPool('pool-1', prismaMock as any)

    // releaseFunds called for each membership
    expect(releaseFunds).toHaveBeenCalledTimes(2)
    for (let i = 1; i <= 2; i++) {
      expect(releaseFunds).toHaveBeenCalledWith(
        prismaMock,
        `user-${i}`,
        300,
        expect.stringContaining('Pool failed'),
        `booking-${i}`,
        'EXAM_BOOKING'
      )
    }

    // Each membership cancelled
    expect(prismaMock.poolMembership.update).toHaveBeenCalledTimes(2)
    expect(prismaMock.poolMembership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'CANCELLED' },
      })
    )

    // Pool set to FAILED
    expect(prismaMock.examPool.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pool-1' },
        data: { status: 'FAILED' },
      })
    )

    // Failure emails sent
    expect(sendPoolFailedEmail).toHaveBeenCalledTimes(2)
  })

  it('marks associated bookings as FAILED with refund amount', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce(pool as any)
    prismaMock.poolMembership.findMany.mockResolvedValueOnce([makeMembership(1)] as any)
    prismaMock.poolMembership.update.mockResolvedValue({} as any)
    prismaMock.examBooking.update.mockResolvedValue({} as any)
    prismaMock.examPool.update.mockResolvedValue({} as any)

    await failPool('pool-1', prismaMock as any)

    expect(prismaMock.examBooking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-1' },
        data: expect.objectContaining({
          status: 'FAILED',
          refundAmount: 300,
          cancellationReason: expect.stringContaining('Go/No-Go'),
        }),
      })
    )
  })

  it('handles pool with no reserved memberships gracefully', async () => {
    prismaMock.examPool.findUnique.mockResolvedValueOnce(pool as any)
    prismaMock.poolMembership.findMany.mockResolvedValueOnce([])
    prismaMock.examPool.update.mockResolvedValue({} as any)

    await failPool('pool-1', prismaMock as any)

    expect(releaseFunds).not.toHaveBeenCalled()
    expect(prismaMock.examPool.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } })
    )
  })
})
