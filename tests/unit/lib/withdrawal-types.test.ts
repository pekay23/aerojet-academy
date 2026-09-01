import { describe, it, expect } from 'vitest'
import { getWithdrawalReason, validateWithdrawal, calculateWithdrawalFee, WITHDRAWAL_STATUS, WITHDRAWAL_METHODS } from '@/lib/withdrawal/types'

describe('lib/withdrawal/types', () => {
  describe('WITHDRAWAL_STATUS', () => {
    it('has expected status values', () => {
      expect(WITHDRAWAL_STATUS.PENDING).toBe('PENDING')
      expect(WITHDRAWAL_STATUS.PROCESSING).toBe('PROCESSING')
      expect(WITHDRAWAL_STATUS.COMPLETED).toBe('COMPLETED')
      expect(WITHDRAWAL_STATUS.FAILED).toBe('FAILED')
    })
  })

  describe('WITHDRAWAL_METHODS', () => {
    it('has expected methods', () => {
      expect(WITHDRAWAL_METHODS.BANK_TRANSFER).toBeDefined()
      expect(WITHDRAWAL_METHODS.MPESA).toBeDefined()
    })
  })

  describe('getWithdrawalReason', () => {
    it('returns reason by code', () => {
      expect(getWithdrawalReason('FINANCIAL')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getWithdrawalReason('UNKNOWN')).toBeUndefined()
    })
  })

  describe('validateWithdrawal', () => {
    it('returns valid for valid withdrawal', () => {
      const result = validateWithdrawal({ amount: 100, method: 'MPESA', reason: 'FINANCIAL' })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for amount below minimum', () => {
      const result = validateWithdrawal({ amount: 10, method: 'MPESA', reason: 'FINANCIAL' })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for missing method', () => {
      const result = validateWithdrawal({ amount: 100, reason: 'FINANCIAL' })
      expect(result.valid).toBe(false)
    })
  })

  describe('calculateWithdrawalFee', () => {
    it('returns fee for bank transfer', () => {
      const fee = calculateWithdrawalFee('BANK_TRANSFER', 1000)
      expect(fee).toBeGreaterThan(0)
    })

    it('returns fee for MPESA', () => {
      const fee = calculateWithdrawalFee('MPESA', 1000)
      expect(fee).toBeGreaterThan(0)
    })

    it('returns 0 for unknown method', () => {
      expect(calculateWithdrawalFee('UNKNOWN', 1000)).toBe(0)
    })
  })
})
