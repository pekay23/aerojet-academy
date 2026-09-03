import { describe, it, expect } from 'vitest'
import { POOL_EXAM_FEE, POOL_MIN_CANDIDATES, POOL_MAX_CANDIDATES, POOL_NEAR_FULL_THRESHOLD, MODULE_DIVERSITY_CAP, POOL_DEADLINE_DAYS, MAX_TOTAL_STUDENT_POOLS } from '@/lib/pools/types'

describe('lib/pools/types', () => {
  it('has correct pool exam fee', () => {
    expect(POOL_EXAM_FEE).toBe(300)
  })

  it('has correct min candidates', () => {
    expect(POOL_MIN_CANDIDATES).toBe(25)
  })

  it('has correct max candidates', () => {
    expect(POOL_MAX_CANDIDATES).toBe(28)
  })

  it('has correct near full threshold', () => {
    expect(POOL_NEAR_FULL_THRESHOLD).toBe(23)
  })

  it('has correct module diversity cap', () => {
    expect(MODULE_DIVERSITY_CAP).toBe(4)
  })

  it('has correct deadline days', () => {
    expect(POOL_DEADLINE_DAYS).toBe(21)
  })

  it('has correct max total student pools', () => {
    expect(MAX_TOTAL_STUDENT_POOLS).toBe(4)
  })

  it('min is less than max', () => {
    expect(POOL_MIN_CANDIDATES).toBeLessThan(POOL_MAX_CANDIDATES)
  })

  it('near-full threshold is between 0 and min', () => {
    expect(POOL_NEAR_FULL_THRESHOLD).toBeGreaterThan(0)
    expect(POOL_NEAR_FULL_THRESHOLD).toBeLessThan(POOL_MIN_CANDIDATES)
  })
})
