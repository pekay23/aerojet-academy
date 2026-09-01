import { describe, it, expect } from 'vitest'
import { generateAnalyticsReport, getAnalyticsMetrics, formatAnalyticsDate, ANALYTICS_PERIODS } from '@/lib/analytics/report-generator'

describe('lib/analytics/report-generator', () => {
  describe('ANALYTICS_PERIODS', () => {
    it('has expected periods', () => {
      expect(ANALYTICS_PERIODS.DAILY).toBeDefined()
      expect(ANALYTICS_PERIODS.WEEKLY).toBeDefined()
      expect(ANALYTICS_PERIODS.MONTHLY).toBeDefined()
      expect(ANALYTICS_PERIODS.YEARLY).toBeDefined()
    })
  })

  describe('generateAnalyticsReport', () => {
    it('returns report object', () => {
      const report = generateAnalyticsReport('MONTHLY', new Date('2026-01-01'), new Date('2026-01-31'))
      expect(report).toBeDefined()
      expect(typeof report).toBe('object')
    })

    it('includes period', () => {
      const report = generateAnalyticsReport('MONTHLY', new Date('2026-01-01'), new Date('2026-01-31'))
      expect(report.period).toBe('MONTHLY')
    })

    it('includes date range', () => {
      const report = generateAnalyticsReport('MONTHLY', new Date('2026-01-01'), new Date('2026-01-31'))
      expect(report.startDate).toBeInstanceOf(Date)
      expect(report.endDate).toBeInstanceOf(Date)
    })
  })

  describe('getAnalyticsMetrics', () => {
    it('returns metrics object', () => {
      const metrics = getAnalyticsMetrics('MONTHLY', new Date('2026-01-01'), new Date('2026-01-31'))
      expect(metrics).toBeDefined()
      expect(typeof metrics).toBe('object')
    })

    it('includes enrollment count', () => {
      const metrics = getAnalyticsMetrics('MONTHLY', new Date('2026-01-01'), new Date('2026-01-31'))
      expect(metrics.enrollments).toBeDefined()
    })

    it('includes revenue', () => {
      const metrics = getAnalyticsMetrics('MONTHLY', new Date('2026-01-01'), new Date('2026-01-31'))
      expect(metrics.revenue).toBeDefined()
    })
  })

  describe('formatAnalyticsDate', () => {
    it('returns formatted date string', () => {
      const date = new Date('2026-01-15')
      const formatted = formatAnalyticsDate(date, 'MONTHLY')
      expect(typeof formatted).toBe('string')
      expect(formatted).toContain('2026')
    })

    it('formats daily period correctly', () => {
      const date = new Date('2026-01-15')
      const formatted = formatAnalyticsDate(date, 'DAILY')
      expect(formatted).toContain('Jan')
    })
  })
})
