import { describe, it, expect } from 'vitest'
import { formatDate, daysUntil, isPast, isFuture } from '@/lib/utils/date'

describe('Date Utilities', () => {
  it('formats date correctly', () => {
    expect(formatDate('2026-03-15')).toContain('Mar')
    expect(formatDate('2026-03-15')).toContain('2026')
  })

  it('calculates days until future date', () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    expect(daysUntil(future)).toBeGreaterThanOrEqual(9)
  })

  it('detects past dates', () => {
    expect(isPast('2020-01-01')).toBe(true)
    expect(isPast('2099-01-01')).toBe(false)
  })

  it('detects future dates', () => {
    expect(isFuture('2099-01-01')).toBe(true)
    expect(isFuture('2020-01-01')).toBe(false)
  })
})
