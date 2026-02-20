import { describe, it, expect } from 'vitest'
import { formatCurrency, formatEuro, parseCurrency } from '@/lib/utils/currency'

describe('Currency Utilities', () => {
  it('formats EUR correctly', () => {
    expect(formatEuro(1500)).toContain('1,500')
    expect(formatEuro(300)).toContain('300')
  })

  it('handles string amounts', () => {
    expect(formatCurrency('1500.50')).toContain('1,500.50')
  })

  it('parses currency strings', () => {
    expect(parseCurrency('€1,500.00')).toBe(1500)
    expect(parseCurrency('$300')).toBe(300)
  })

  it('handles zero', () => {
    expect(formatEuro(0)).toContain('0.00')
  })
})
