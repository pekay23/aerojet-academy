import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime, formatRelative, daysUntil, isPast, isFuture, addDaysToDate } from '@/lib/utils/date'

describe('lib/utils/date', () => {
  describe('formatDate', () => {
    it('formats Date object', () => {
      const result = formatDate(new Date('2026-01-15'))
      expect(result).toContain('2026')
      expect(result).toContain('Jan')
    })

    it('formats ISO string', () => {
      const result = formatDate('2026-01-15')
      expect(result).toContain('2026')
    })
  })

  describe('formatDateTime', () => {
    it('formats Date object with time', () => {
      const result = formatDateTime(new Date('2026-01-15T14:30:00'))
      expect(result).toContain('2026')
      expect(result).toContain('Jan')
    })
  })

  describe('formatRelative', () => {
    it('returns relative time string', () => {
      const result = formatRelative(new Date(Date.now() - 1000 * 60 * 5))
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('daysUntil', () => {
    it('returns positive for future dates', () => {
      const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      expect(daysUntil(future)).toBeGreaterThanOrEqual(4)
    })

    it('returns negative for past dates', () => {
      const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      expect(daysUntil(past)).toBeLessThanOrEqual(-4)
    })
  })

  describe('isPast', () => {
    it('returns true for past dates', () => {
      expect(isPast(new Date(Date.now() - 1000))).toBe(true)
    })

    it('returns false for future dates', () => {
      expect(isPast(new Date(Date.now() + 1000))).toBe(false)
    })
  })

  describe('isFuture', () => {
    it('returns true for future dates', () => {
      expect(isFuture(new Date(Date.now() + 1000))).toBe(true)
    })

    it('returns false for past dates', () => {
      expect(isFuture(new Date(Date.now() - 1000))).toBe(false)
    })
  })

  describe('addDaysToDate', () => {
    it('adds days correctly', () => {
      const d = new Date('2026-01-15')
      const result = addDaysToDate(d, 5)
      expect(result.getDate()).toBe(20)
    })

    it('handles negative days', () => {
      const d = new Date('2026-01-15')
      const result = addDaysToDate(d, -5)
      expect(result.getDate()).toBe(10)
    })
  })
})
