import { describe, it, expect } from 'vitest'
import { isValidReferralCode, generateReferralCode } from '@/lib/referral/validation'

describe('lib/referral/validation', () => {
  describe('isValidReferralCode', () => {
    it('returns true for valid code', () => {
      expect(isValidReferralCode('REF1234')).toBe(true)
      expect(isValidReferralCode('ABC123')).toBe(true)
    })

    it('returns false for empty string', () => {
      expect(isValidReferralCode('')).toBe(false)
    })

    it('returns false for null', () => {
      expect(isValidReferralCode(null)).toBe(false)
    })

    it('returns false for too short code', () => {
      expect(isValidReferralCode('AB1')).toBe(false)
    })

    it('returns false for too long code', () => {
      expect(isValidReferralCode('ABCDEFGHIJKLMNOP')).toBe(false)
    })

    it('returns false for code with special characters', () => {
      expect(isValidReferralCode('REF-123')).toBe(false)
    })
  })

  describe('generateReferralCode', () => {
    it('returns string', () => {
      expect(typeof generateReferralCode()).toBe('string')
    })

    it('returns code of expected length', () => {
      const code = generateReferralCode()
      expect(code.length).toBeGreaterThanOrEqual(6)
      expect(code.length).toBeLessThanOrEqual(10)
    })

    it('returns valid code', () => {
      expect(isValidReferralCode(generateReferralCode())).toBe(true)
    })
  })
})
