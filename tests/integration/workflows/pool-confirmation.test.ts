import { describe, it, expect } from 'vitest'
import { mockPool, mockNearFullPool, mockConfirmedPool } from '@/tests/fixtures/pools'

describe('Pool Confirmation Workflow', () => {
  it('pool progresses through statuses', () => {
    expect(mockPool.status).toBe('OPEN')
    expect(mockNearFullPool.status).toBe('NEAR_FULL')
    expect(mockConfirmedPool.status).toBe('CONFIRMED')
  })

  it('near full pool is close to min', () => {
    expect(mockNearFullPool.currentMemberCount).toBeGreaterThanOrEqual(23)
    expect(mockNearFullPool.currentMemberCount).toBeLessThan(25)
  })

  it('confirmed pool meets minimum', () => {
    expect(mockConfirmedPool.currentMemberCount).toBeGreaterThanOrEqual(25)
  })
})
