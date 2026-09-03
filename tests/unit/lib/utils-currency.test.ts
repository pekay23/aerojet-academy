import { describe, it, expect } from 'vitest'
import { parseCurrency } from '@/lib/utils/currency'

describe('lib/utils/currency', () => {
  it('parses plain number string', () => {
    expect(parseCurrency('100')).toBe(100)
  })

  it('parses currency with symbol', () => {
    expect(parseCurrency('€100')).toBe(100)
  })

  it('parses currency with commas', () => {
    expect(parseCurrency('1,000.50')).toBe(1000.5)
  })

  it('parses negative values', () => {
    expect(parseCurrency('-50')).toBe(-50)
  })

  it('returns 0 for invalid input', () => {
    expect(parseCurrency('abc')).toBe(0)
    expect(parseCurrency('')).toBe(0)
  })

  it('handles mixed currency symbols', () => {
    expect(parseCurrency('$1,234.56')).toBe(1234.56)
  })
})
