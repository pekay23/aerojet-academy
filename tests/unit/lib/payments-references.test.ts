import { describe, it, expect } from 'vitest'
import { formatPaymentReference, isPaymentReference, PAYMENT_REFERENCE_PREFIX } from '@/lib/payments/references'

describe('lib/payments/references', () => {
  describe('PAYMENT_REFERENCE_PREFIX', () => {
    it('is a string', () => {
      expect(typeof PAYMENT_REFERENCE_PREFIX).toBe('string')
    })

    it('has length greater than 0', () => {
      expect(PAYMENT_REFERENCE_PREFIX.length).toBeGreaterThan(0)
    })
  })

  describe('formatPaymentReference', () => {
    it('returns string', () => {
      expect(typeof formatPaymentReference(123)).toBe('string')
    })

    it('includes prefix', () => {
      expect(formatPaymentReference(1)).toContain(PAYMENT_REFERENCE_PREFIX)
    })

    it('includes numeric part', () => {
      expect(formatPaymentReference(123)).toContain('123')
    })

    it('pads short numbers', () => {
      expect(formatPaymentReference(1).length).toBeGreaterThan(1)
    })
  })

  describe('isPaymentReference', () => {
    it('returns true for valid reference', () => {
      expect(isPaymentReference(formatPaymentReference(123))).toBe(true)
    })

    it('returns false for invalid reference', () => {
      expect(isPaymentReference('INVALID')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isPaymentReference('')).toBe(false)
    })
  })
})
