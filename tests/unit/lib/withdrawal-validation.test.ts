import { describe, it, expect } from 'vitest'
import { validateWithdrawalReason, getWithdrawalType, calculateRefundAmount, isRefundEligible, WITHDRAWAL_TYPES, REFUND_POLICIES } from '@/lib/withdrawal/validation'

describe('lib/withdrawal/validation', () => {
  describe('WITHDRAWAL_TYPES', () => {
    it('has expected types', () => {
      expect(WITHDRAWAL_TYPES.VOLUNTARY).toBe('VOLUNTARY')
      expect(WITHDRAWAL_TYPES.ACADEMIC).toBe('ACADEMIC')
      expect(WITHDRAWAL_TYPES.FINANCIAL).toBe('FINANCIAL')
      expect(WITHDRAWAL_TYPES.MEDICAL).toBe('MEDICAL')
    })
  })

  describe('REFUND_POLICIES', () => {
    it('has refund percentage for each type', () => {
      for (const [type, policy] of Object.entries(REFUND_POLICIES)) {
        expect(policy.refundPercentage).toBeGreaterThanOrEqual(0)
        expect(policy.refundPercentage).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('validateWithdrawalReason', () => {
    it('returns valid for valid reason', () => {
      const result = validateWithdrawalReason('Personal reasons')
      expect(result.valid).toBe(true)
    })

    it('returns invalid for empty reason', () => {
      const result = validateWithdrawalReason('')
      expect(result.valid).toBe(false)
    })

    it('returns invalid for null reason', () => {
      const result = validateWithdrawalReason(null)
      expect(result.valid).toBe(false)
    })
  })

  describe('getWithdrawalType', () => {
    it('returns type by code', () => {
      expect(getWithdrawalType('VOLUNTARY')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getWithdrawalType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('calculateRefundAmount', () => {
    it('calculates refund based on policy', () => {
      const amount = calculateRefundAmount('VOLUNTARY', 1000)
      expect(amount).toBeGreaterThanOrEqual(0)
      expect(amount).toBeLessThanOrEqual(1000)
    })

    it('returns 0 for null type', () => {
      expect(calculateRefundAmount(null, 1000)).toBe(0)
    })
  })

  describe('isRefundEligible', () => {
    it('returns true for eligible withdrawal', () => {
      expect(isRefundEligible('VOLUNTARY')).toBe(true)
    })

    it('returns false for non-refundable withdrawal', () => {
      expect(isRefundEligible('ACADEMIC')).toBe(false)
    })
  })
})
