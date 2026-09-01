import { describe, it, expect } from 'vitest'
import { formatExamEventDate, getExamEventStatus, isExamEventUpcoming, getExamEventDuration, EXAM_EVENT_STATUS, EXAM_EVENT_TYPES } from '@/lib/exams/events'

describe('lib/exams/events', () => {
  describe('EXAM_EVENT_STATUS', () => {
    it('has expected status values', () => {
      expect(EXAM_EVENT_STATUS.SCHEDULED).toBe('SCHEDULED')
      expect(EXAM_EVENT_STATUS.ONGOING).toBe('ONGOING')
      expect(EXAM_EVENT_STATUS.COMPLETED).toBe('COMPLETED')
      expect(EXAM_EVENT_STATUS.CANCELLED).toBe('CANCELLED')
    })
  })

  describe('EXAM_EVENT_TYPES', () => {
    it('has expected types', () => {
      expect(EXAM_EVENT_TYPES.THEORY).toBe('THEORY')
      expect(EXAM_EVENT_TYPES.PRACTICAL).toBe('PRACTICAL')
      expect(EXAM_EVENT_TYPES.ORAL).toBe('ORAL')
    })
  })

  describe('formatExamEventDate', () => {
    it('returns formatted date string', () => {
      const date = new Date('2026-01-15T09:00:00')
      const formatted = formatExamEventDate(date)
      expect(typeof formatted).toBe('string')
      expect(formatted).toContain('2026')
    })
  })

  describe('getExamEventStatus', () => {
    it('returns SCHEDULED for future event', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      expect(getExamEventStatus(futureDate)).toBe('SCHEDULED')
    })

    it('returns COMPLETED for past event', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      expect(getExamEventStatus(pastDate)).toBe('COMPLETED')
    })
  })

  describe('isExamEventUpcoming', () => {
    it('returns true for future event', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      expect(isExamEventUpcoming(futureDate)).toBe(true)
    })

    it('returns false for past event', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      expect(isExamEventUpcoming(pastDate)).toBe(false)
    })
  })

  describe('getExamEventDuration', () => {
    it('returns duration in minutes', () => {
      const start = new Date('2026-01-01T09:00:00')
      const end = new Date('2026-01-01T11:00:00')
      expect(getExamEventDuration(start, end)).toBe(120)
    })

    it('returns 0 for zero duration', () => {
      const start = new Date('2026-01-01T09:00:00')
      expect(getExamEventDuration(start, start)).toBe(0)
    })
  })
})
