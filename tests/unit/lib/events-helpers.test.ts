import { describe, it, expect } from 'vitest'
import { getEventType, getEventStatus, isEventUpcoming, isEventPast, getDaysUntilEvent, EVENT_TYPES, EVENT_STATUS } from '@/lib/events/helpers'

describe('lib/events/helpers', () => {
  describe('EVENT_TYPES', () => {
    it('has expected types', () => {
      expect(EVENT_TYPES.OPEN_DAY).toBeDefined()
      expect(EVENT_TYPES.INFO_SESSION).toBeDefined()
      expect(EVENT_TYPES.WORKSHOP).toBeDefined()
    })
  })

  describe('EVENT_STATUS', () => {
    it('has expected status values', () => {
      expect(EVENT_STATUS.UPCOMING).toBe('UPCOMING')
      expect(EVENT_STATUS.ONGOING).toBe('ONGOING')
      expect(EVENT_STATUS.COMPLETED).toBe('COMPLETED')
      expect(EVENT_STATUS.CANCELLED).toBe('CANCELLED')
    })
  })

  describe('getEventType', () => {
    it('returns type by code', () => {
      expect(getEventType('OPEN_DAY')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getEventType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('getEventStatus', () => {
    it('returns UPCOMING for future event', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      expect(getEventStatus(futureDate)).toBe('UPCOMING')
    })

    it('returns COMPLETED for past event', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      expect(getEventStatus(pastDate)).toBe('COMPLETED')
    })
  })

  describe('isEventUpcoming', () => {
    it('returns true for future event', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      expect(isEventUpcoming(futureDate)).toBe(true)
    })

    it('returns false for past event', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      expect(isEventUpcoming(pastDate)).toBe(false)
    })
  })

  describe('isEventPast', () => {
    it('returns true for past event', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      expect(isEventPast(pastDate)).toBe(true)
    })

    it('returns false for future event', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      expect(isEventPast(futureDate)).toBe(false)
    })
  })

  describe('getDaysUntilEvent', () => {
    it('returns positive days for future event', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      expect(getDaysUntilEvent(futureDate)).toBeGreaterThan(0)
    })

    it('returns 0 for today', () => {
      const today = new Date()
      expect(getDaysUntilEvent(today)).toBe(0)
    })

    it('returns negative for past event', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      expect(getDaysUntilEvent(pastDate)).toBeLessThan(0)
    })
  })
})
