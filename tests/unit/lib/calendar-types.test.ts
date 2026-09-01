import { describe, it, expect } from 'vitest'
import { getCalendarEventType, formatCalendarEvent, isCalendarEventUpcoming, getCalendarEventDuration, CALENDAR_EVENT_TYPES, CALENDAR_EVENT_COLORS } from '@/lib/calendar/types'

describe('lib/calendar/types', () => {
  describe('CALENDAR_EVENT_TYPES', () => {
    it('has expected types', () => {
      expect(CALENDAR_EVENT_TYPES.CLASS).toBeDefined()
      expect(CALENDAR_EVENT_TYPES.EXAM).toBeDefined()
      expect(CALENDAR_EVENT_TYPES.EVENT).toBeDefined()
      expect(CALENDAR_EVENT_TYPES.HOLIDAY).toBeDefined()
    })

    it('each type has label', () => {
      for (const [key, type] of Object.entries(CALENDAR_EVENT_TYPES)) {
        expect(type.label).toBeDefined()
        expect(typeof type.label).toBe('string')
      }
    })
  })

  describe('CALENDAR_EVENT_COLORS', () => {
    it('has color for each type', () => {
      for (const [type, color] of Object.entries(CALENDAR_EVENT_COLORS)) {
        expect(color).toBeDefined()
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    })
  })

  describe('getCalendarEventType', () => {
    it('returns type by code', () => {
      expect(getCalendarEventType('CLASS')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getCalendarEventType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('formatCalendarEvent', () => {
    it('returns formatted string', () => {
      const event = { title: 'Test Class', start: new Date('2026-01-01T09:00:00'), end: new Date('2026-01-01T11:00:00') }
      expect(typeof formatCalendarEvent(event)).toBe('string')
    })

    it('includes title', () => {
      const event = { title: 'Test Class', start: new Date(), end: new Date() }
      expect(formatCalendarEvent(event)).toContain('Test Class')
    })
  })

  describe('isCalendarEventUpcoming', () => {
    it('returns true for future event', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      expect(isCalendarEventUpcoming(futureDate)).toBe(true)
    })

    it('returns false for past event', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      expect(isCalendarEventUpcoming(pastDate)).toBe(false)
    })
  })

  describe('getCalendarEventDuration', () => {
    it('returns duration in hours', () => {
      const start = new Date('2026-01-01T09:00:00')
      const end = new Date('2026-01-01T11:00:00')
      expect(getCalendarEventDuration(start, end)).toBe(2)
    })

    it('returns 0 for zero duration', () => {
      const start = new Date('2026-01-01T09:00:00')
      expect(getCalendarEventDuration(start, start)).toBe(0)
    })
  })
})
