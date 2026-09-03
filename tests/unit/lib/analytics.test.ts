import { describe, it, expect } from 'vitest'
import { calculateFillRate, calculateGrowth, formatCurrency } from '@/lib/analytics/metrics'

describe('Analytics Metrics', () => {
  describe('calculateFillRate', () => {
    it('calculates perfect fill rate', () => {
      expect(calculateFillRate(10, 10)).toBe(100)
    })

    it('calculates partial fill rate', () => {
      expect(calculateFillRate(5, 10)).toBe(50)
    })

    it('handles zero max candidates', () => {
      expect(calculateFillRate(5, 0)).toBe(0)
    })

    it('rounds to nearest integer', () => {
      expect(calculateFillRate(1, 3)).toBe(33)
    })
  })

  describe('calculateGrowth', () => {
    it('calculates positive growth', () => {
      expect(calculateGrowth(150, 100)).toBe(50)
    })

    it('calculates negative growth', () => {
      expect(calculateGrowth(50, 100)).toBe(-50)
    })

    it('handles zero previous value with positive current', () => {
      expect(calculateGrowth(10, 0)).toBe(100)
    })

    it('handles zero previous and current value', () => {
      expect(calculateGrowth(0, 0)).toBe(0)
    })
  })

  describe('formatCurrency', () => {
    it('formats with default EUR', () => {
      const result = formatCurrency(1234.56)
      expect(result).toContain('€')
      expect(result).toContain('1,234.56')
    })

    it('formats with GHS', () => {
      const result = formatCurrency(1000, 'GHS')
      expect(result).toContain('GH₵')
      expect(result).toContain('1,000.00')
    })

    it('handles string amounts', () => {
      expect(formatCurrency('2500.75')).toContain('2,500.75')
    })
  })
})
