import { describe, it, expect } from 'vitest'
import { getPaymentMethod, validatePaymentDetails, calculatePaymentFee, PAYMENT_METHODS, PAYMENT_FEES } from '@/lib/payments/methods'

describe('lib/payments/methods', () => {
  describe('PAYMENT_METHODS', () => {
    it('has expected methods', () => {
      expect(PAYMENT_METHODS.MPESA).toBeDefined()
      expect(PAYMENT_METHODS.BANK_TRANSFER).toBeDefined()
      expect(PAYMENT_METHODS.CREDIT_CARD).toBeDefined()
    })

    it('each method has name', () => {
      for (const [key, method] of Object.entries(PAYMENT_METHODS)) {
        expect(method.name).toBeDefined()
        expect(typeof method.name).toBe('string')
      }
    })
  })

  describe('PAYMENT_FEES', () => {
    it('has fee for each method', () => {
      for (const [method, fee] of Object.entries(PAYMENT_FEES)) {
        expect(fee).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('getPaymentMethod', () => {
    it('returns method by code', () => {
      expect(getPaymentMethod('MPESA')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getPaymentMethod('UNKNOWN')).toBeUndefined()
    })
  })

  describe('validatePaymentDetails', () => {
    it('returns valid for MPESA', () => {
      const result = validatePaymentDetails('MPESA', { phone: '254700000000' })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for missing phone in MPESA', () => {
      const result = validatePaymentDetails('MPESA', {})
      expect(result.valid).toBe(false)
    })

    it('returns invalid for unknown method', () => {
      const result = validatePaymentDetails('UNKNOWN', {})
      expect(result.valid).toBe(false)
    })
  })

  describe('calculatePaymentFee', () => {
    it('calculates fee for MPESA', () => {
      const fee = calculatePaymentFee('MPESA', 1000)
      expect(fee).toBeGreaterThanOrEqual(0)
    })

    it('returns 0 for unknown method', () => {
      expect(calculatePaymentFee('UNKNOWN', 1000)).toBe(0)
    })

    it('calculates fee as percentage', () => {
      const fee = calculatePaymentFee('CREDIT_CARD', 1000)
      expect(fee).toBe(1000 * (PAYMENT_FEES.CREDIT_CARD / 100))
    })
  })
})
