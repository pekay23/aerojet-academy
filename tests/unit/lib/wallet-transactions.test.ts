import { describe, it, expect } from 'vitest'
import { generatePaymentReference, generateWalletTopUpReference } from '@/lib/wallet/transactions'

describe('lib/wallet/transactions', () => {
  describe('generatePaymentReference', () => {
    it('generates reference with prefix', () => {
      const ref = generatePaymentReference('PAY')
      expect(ref.startsWith('PAY-')).toBe(true)
    })

    it('generates unique references', () => {
      const ref1 = generatePaymentReference('PAY')
      const ref2 = generatePaymentReference('PAY')
      expect(ref1).not.toBe(ref2)
    })

    it('uses default prefix when not provided', () => {
      const ref = generatePaymentReference()
      expect(ref.startsWith('PAY-')).toBe(true)
    })

    it('has correct format (prefix-timestamp-random)', () => {
      const ref = generatePaymentReference('TEST')
      const parts = ref.split('-')
      expect(parts[0]).toBe('TEST')
      expect(parts.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('generateWalletTopUpReference', () => {
    it('generates reference with WTU prefix', () => {
      const ref = generateWalletTopUpReference()
      expect(ref.startsWith('WTU-')).toBe(true)
    })

    it('generates unique references', () => {
      const ref1 = generateWalletTopUpReference()
      const ref2 = generateWalletTopUpReference()
      expect(ref1).not.toBe(ref2)
    })
  })
})
