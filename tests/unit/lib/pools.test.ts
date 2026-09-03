import { describe, it, expect } from 'vitest'
import {
  POOL_EXAM_FEE,
  POOL_MIN_CANDIDATES,
  POOL_MAX_CANDIDATES,
  POOL_NEAR_FULL_THRESHOLD,
  MODULE_DIVERSITY_CAP,
  MAX_TOTAL_STUDENT_POOLS,
  POOL_DEADLINE_DAYS,
} from '@/lib/pools/types'

describe('Pool Constants', () => {
  it('has correct exam fee', () => {
    expect(POOL_EXAM_FEE).toBe(300)
  })
  it('has correct min candidates', () => {
    expect(POOL_MIN_CANDIDATES).toBe(25)
  })
  it('has correct max candidates', () => {
    expect(POOL_MAX_CANDIDATES).toBe(28)
  })
  it('has correct diversity cap', () => {
    expect(MODULE_DIVERSITY_CAP).toBe(4)
  })
  it('min is less than max', () => {
    expect(POOL_MIN_CANDIDATES).toBeLessThan(POOL_MAX_CANDIDATES)
  })
  it('near-full threshold is between 0 and min', () => {
    expect(POOL_NEAR_FULL_THRESHOLD).toBeGreaterThan(0)
    expect(POOL_NEAR_FULL_THRESHOLD).toBeLessThan(POOL_MIN_CANDIDATES)
  })
  it('deadline days is positive', () => {
    expect(POOL_DEADLINE_DAYS).toBeGreaterThan(0)
  })
  it('max total student pools limits concurrent bookings', () => {
    expect(MAX_TOTAL_STUDENT_POOLS).toBe(4)
  })
})

describe('Pool Status Transition Logic', () => {
  // This mirrors the status decision logic in joinPoolInternal (lib/pools/join.ts)
  function determineNewPoolStatus(
    currentStatus: string,
    newMemberCount: number,
    isJoiningConfirmedPool: boolean
  ): string {
    if (isJoiningConfirmedPool && newMemberCount >= POOL_MAX_CANDIDATES) return 'LOCKED'
    if (isJoiningConfirmedPool) return 'CONFIRMED'
    if (newMemberCount >= POOL_MIN_CANDIDATES) return 'CONFIRMED'
    if (newMemberCount >= POOL_NEAR_FULL_THRESHOLD) return 'NEAR_FULL'
    return currentStatus
  }

  it('keeps current status when count is below near-full threshold', () => {
    expect(determineNewPoolStatus('OPEN', 10, false)).toBe('OPEN')
    expect(determineNewPoolStatus('OPEN', 1, false)).toBe('OPEN')
    expect(determineNewPoolStatus('DRAFT', 5, false)).toBe('DRAFT')
    expect(determineNewPoolStatus('OPEN', POOL_NEAR_FULL_THRESHOLD - 1, false)).toBe('OPEN')
  })

  it('transitions to NEAR_FULL at threshold', () => {
    expect(determineNewPoolStatus('OPEN', POOL_NEAR_FULL_THRESHOLD, false)).toBe('NEAR_FULL')
    expect(determineNewPoolStatus('OPEN', POOL_NEAR_FULL_THRESHOLD + 1, false)).toBe('NEAR_FULL')
    expect(determineNewPoolStatus('OPEN', POOL_MIN_CANDIDATES - 1, false)).toBe('NEAR_FULL')
  })

  it('transitions to CONFIRMED when min candidates reached', () => {
    expect(determineNewPoolStatus('OPEN', POOL_MIN_CANDIDATES, false)).toBe('CONFIRMED')
    expect(determineNewPoolStatus('NEAR_FULL', POOL_MIN_CANDIDATES, false)).toBe('CONFIRMED')
    expect(determineNewPoolStatus('OPEN', POOL_MIN_CANDIDATES + 1, false)).toBe('CONFIRMED')
  })

  it('stays CONFIRMED when joining a confirmed pool below max', () => {
    expect(determineNewPoolStatus('CONFIRMED', 26, true)).toBe('CONFIRMED')
    expect(determineNewPoolStatus('CONFIRMED', 27, true)).toBe('CONFIRMED')
  })

  it('transitions to LOCKED at max capacity for confirmed pool', () => {
    expect(determineNewPoolStatus('CONFIRMED', POOL_MAX_CANDIDATES, true)).toBe('LOCKED')
    expect(determineNewPoolStatus('CONFIRMED', POOL_MAX_CANDIDATES + 1, true)).toBe('LOCKED')
  })

  it('CONFIRMED join always overrides non-max status', () => {
    // Even if current status is something else, joining a confirmed pool keeps CONFIRMED
    expect(determineNewPoolStatus('OPEN', 15, true)).toBe('CONFIRMED')
    expect(determineNewPoolStatus('NEAR_FULL', 24, true)).toBe('CONFIRMED')
  })
})
