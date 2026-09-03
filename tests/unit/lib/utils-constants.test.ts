import { describe, it, expect } from 'vitest'
import { APP_NAME, APP_SHORT, APP_DOMAIN, CURRENCY, EXAM_FEE, MIN_WALLET_TOPUP, MAX_WALLET_TOPUP, POOL_MIN, POOL_MAX, POOL_NEAR_FULL, POOL_DEADLINE_DAYS_BEFORE, MODULE_DIVERSITY_CAP, ACTIVE_MEMBERSHIP_STATUSES, COUNTABLE_MEMBERSHIP_STATUSES, BOOKABLE_POOL_STATUSES, LIVE_POOL_STATUSES, TERMINAL_POOL_STATUSES, UPCOMING_EVENT_STATUSES, PROGRAMMES, ROLES, B1_MODULES, B2_MODULES } from '@/lib/utils/constants'

describe('lib/utils/constants', () => {
  it('has correct app metadata', () => {
    expect(APP_NAME).toBe('Aerojet Aviation Training Academy')
    expect(APP_SHORT).toBe('Aerojet Academy')
    expect(APP_DOMAIN).toBe('aerojet-academy.com')
  })

  it('has correct currency and fee defaults', () => {
    expect(CURRENCY).toBe('EUR')
    expect(EXAM_FEE).toBe(300)
    expect(MIN_WALLET_TOPUP).toBe(50)
    expect(MAX_WALLET_TOPUP).toBe(10000)
  })

  it('has correct pool constants', () => {
    expect(POOL_MIN).toBe(25)
    expect(POOL_MAX).toBe(28)
    expect(POOL_NEAR_FULL).toBe(23)
    expect(POOL_DEADLINE_DAYS_BEFORE).toBe(21)
    expect(MODULE_DIVERSITY_CAP).toBe(4)
  })

  it('has valid membership status arrays', () => {
    expect(ACTIVE_MEMBERSHIP_STATUSES).toEqual(['RESERVED', 'CONFIRMED'])
    expect(COUNTABLE_MEMBERSHIP_STATUSES).toEqual(['RESERVED', 'CONFIRMED', 'NO_SHOW', 'COMPLETED'])
  })

  it('has valid pool status arrays', () => {
    expect(BOOKABLE_POOL_STATUSES).toEqual(['OPEN', 'NEAR_FULL'])
    expect(LIVE_POOL_STATUSES).toEqual(['OPEN', 'NEAR_FULL', 'CONFIRMED', 'LOCKED'])
    expect(TERMINAL_POOL_STATUSES).toEqual(['FAILED', 'MERGED', 'COMPLETED'])
  })

  it('has valid event status arrays', () => {
    expect(UPCOMING_EVENT_STATUSES).toEqual(['DRAFT', 'OPEN', 'CONFIRMED', 'POSTPONED'])
  })

  it('has correct programmes', () => {
    expect(PROGRAMMES).toHaveLength(6)
    expect(PROGRAMMES[0].value).toBe('FOUR_YEAR')
    expect(PROGRAMMES[5].value).toBe('REVISION')
  })

  it('has correct roles', () => {
    expect(ROLES).toHaveLength(6)
    expect(ROLES.map(r => r.value)).toEqual(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'INSTRUCTOR', 'STUDENT', 'APPLICANT'])
  })

  it('has B1 and B2 module lists', () => {
    expect(B1_MODULES.length).toBeGreaterThan(0)
    expect(B2_MODULES.length).toBeGreaterThan(0)
    expect(B1_MODULES).toContain('M1')
    expect(B2_MODULES).toContain('M1')
  })
})
