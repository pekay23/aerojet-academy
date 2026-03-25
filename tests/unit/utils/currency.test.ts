import { describe, it, expect } from 'vitest'
import { formatCurrency, getCurrencySymbol, parseCurrency } from '@/lib/utils/currency'

describe('Currency Utilities', () => {
  it('formats EUR correctly', () => {
    expect(formatCurrency(1500, 'EUR')).toBe('€1,500.00')
    expect(formatCurrency(300, 'EUR')).toBe('€300.00')
  })

  it('formats GHS correctly', () => {
    expect(formatCurrency(1500, 'GHS')).toBe('GH₵1,500.00')
  })

  it('formats USD correctly', () => {
    expect(formatCurrency(250, 'USD')).toBe('$250.00')
  })

  it('defaults to EUR when no currency specified', () => {
    expect(formatCurrency(100)).toBe('€100.00')
  })

  it('handles string amounts', () => {
    expect(formatCurrency('1500.50')).toBe('€1,500.50')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('€0.00')
  })

  it('returns correct currency symbols', () => {
    expect(getCurrencySymbol('EUR')).toBe('€')
    expect(getCurrencySymbol('GHS')).toBe('GH₵')
    expect(getCurrencySymbol('USD')).toBe('$')
    expect(getCurrencySymbol('UNKNOWN')).toBe('€')
  })

  it('parses currency strings', () => {
    expect(parseCurrency('€1,500.00')).toBe(1500)
    expect(parseCurrency('$300')).toBe(300)
    expect(parseCurrency('GH₵250.50')).toBe(250.5)
  })
})
