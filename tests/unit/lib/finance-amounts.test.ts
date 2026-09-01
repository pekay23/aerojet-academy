import { describe, it, expect } from 'vitest'
import { hashAmount, verifyAmount, isAmountWithinLimit, AMOUNT_LIMITS } from '@/lib/finance/amounts'

describe('lib/finance/amounts', () => {
  describe('hashAmount', () => {
    it('returns string', () => {
      expect(typeof hashAmount('1000')).toBe('string')
    })

    it('returns deterministic hash', () => {
      expect(hashAmount('1000')).toBe(hashAmount('1000'))
    })

    it('returns different hashes for different amounts', () => {
      expect(hashAmount('1000')).not.toBe(hashAmount('2000'))
    })
  })

  describe('verifyAmount', () => {
    it('returns true for matching hash and amount', () => {
      const h = hashAmount('1000')
      expect(verifyAmount(h, '1000')).toBe(true)
    })

    it('returns false for mismatched amount', () => {
      const h = hashAmount('1000')
      expect(verifyAmount(h, '2000')).toBe(false)
    })
  })

  describe('isAmountWithinLimit', () => {
    it('returns true for amount within limit', () => {
      expect(isAmountWithinLimit(1000, 5000)).toBe(true)
    })

    it('returns false for amount exceeding limit', () => {
      expect(isAmountWithinLimit(10000, 5000)).toBe(false)
    })

    it('returns true for amount equal to limit', () => {
      expect(isAmountWithinLimit(5000, 5000)).toBe(true)
    })
  })

  describe('AMOUNT_LIMITS', () => {
    it('has daily limit', () => {
      expect(AMOUNT_LIMITS.daily).toBeGreaterThan(0)
    })

    it('has weekly limit', () => {
      expect(AMOUNT_LIMITS.weekly).toBeGreaterThan(0)
    })

    it('has monthly limit', () => {
      expect(AMOUNT_LIMITS.monthly).toBeGreaterThan(0)
    })
  })
})
