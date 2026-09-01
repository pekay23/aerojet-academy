import { describe, it, expect } from 'vitest'
import { formatCurrencyAmount, calculateTax, getCurrencySymbol, CURRENCY_CONFIG, TAX_RATES } from '@/lib/finance/currency'

describe('lib/finance/currency', () => {
  describe('CURRENCY_CONFIG', () => {
    it('has default currency', () => {
      expect(CURRENCY_CONFIG.default).toBeDefined()
      expect(typeof CURRENCY_CONFIG.default).toBe('string')
    })

    it('has symbol for default currency', () => {
      expect(CURRENCY_CONFIG.symbol).toBeDefined()
      expect(typeof CURRENCY_CONFIG.symbol).toBe('string')
    })
  })

  describe('TAX_RATES', () => {
    it('has VAT rate', () => {
      expect(TAX_RATES.VAT).toBeGreaterThanOrEqual(0)
      expect(TAX_RATES.VAT).toBeLessThanOrEqual(100)
    })
  })

  describe('formatCurrencyAmount', () => {
    it('returns formatted string', () => {
      expect(typeof formatCurrencyAmount(1000)).toBe('string')
    })

    it('includes currency symbol', () => {
      const formatted = formatCurrencyAmount(1000)
      expect(formatted).toContain(CURRENCY_CONFIG.symbol)
    })

    it('formats with commas', () => {
      const formatted = formatCurrencyAmount(1000000)
      expect(formatted).toContain(',')
    })
  })

  describe('calculateTax', () => {
    it('calculates VAT', () => {
      const tax = calculateTax(1000, 'VAT')
      expect(tax).toBeGreaterThan(0)
    })

    it('returns 0 for unknown tax type', () => {
      expect(calculateTax(1000, 'UNKNOWN')).toBe(0)
    })

    it('calculates correct amount', () => {
      const tax = calculateTax(1000, 'VAT')
      expect(tax).toBeCloseTo(1000 * (TAX_RATES.VAT / 100), 2)
    })
  })

  describe('getCurrencySymbol', () => {
    it('returns symbol for default currency', () => {
      expect(getCurrencySymbol()).toBe(CURRENCY_CONFIG.symbol)
    })

    it('returns symbol for specified currency', () => {
      expect(getCurrencySymbol('USD')).toBe('$')
    })

    it('returns empty string for unknown currency', () => {
      expect(getCurrencySymbol('UNKNOWN')).toBe('')
    })
  })
})
