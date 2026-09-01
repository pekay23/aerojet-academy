import { describe, it, expect } from 'vitest'
import { formatCurrency, parseCurrency, CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currency'

describe('lib/currency', () => {
  describe('DEFAULT_CURRENCY', () => {
    it('is a valid currency code', () => {
      expect(typeof DEFAULT_CURRENCY).toBe('string')
      expect(DEFAULT_CURRENCY.length).toBe(3)
    })
  })

  describe('CURRENCIES', () => {
    it('has multiple currencies', () => {
      expect(Object.keys(CURRENCIES).length).toBeGreaterThan(0)
    })

    it('each currency has symbol', () => {
      for (const [code, config] of Object.entries(CURRENCIES)) {
        expect(config.symbol).toBeDefined()
        expect(typeof config.symbol).toBe('string')
      }
    })
  })

  describe('formatCurrency', () => {
    it('returns formatted string', () => {
      expect(typeof formatCurrency(1000)).toBe('string')
    })

    it('formats with default currency', () => {
      const result = formatCurrency(1000)
      expect(result).toContain('1,000')
    })

    it('formats with specified currency', () => {
      const result = formatCurrency(1000, 'USD')
      expect(result).toContain('$')
    })

    it('handles decimal values', () => {
      const result = formatCurrency(1000.50)
      expect(result).toContain('1,000.50')
    })

    it('handles zero', () => {
      const result = formatCurrency(0)
      expect(result).toContain('0')
    })
  })

  describe('parseCurrency', () => {
    it('parses formatted string back to number', () => {
      expect(parseCurrency('$1,000.50')).toBe(1000.50)
    })

    it('parses plain number string', () => {
      expect(parseCurrency('1000')).toBe(1000)
    })

    it('returns 0 for invalid string', () => {
      expect(parseCurrency('not a number')).toBe(0)
    })
  })
})
