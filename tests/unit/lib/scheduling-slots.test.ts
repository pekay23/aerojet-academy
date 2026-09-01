import { describe, it, expect } from 'vitest'
import { validateSlot, getSlotDuration, isSlotAvailable, SLOT_TYPES, SLOT_STATUS } from '@/lib/scheduling/slots'

describe('lib/scheduling/slots', () => {
  describe('SLOT_TYPES', () => {
    it('has expected types', () => {
      expect(SLOT_TYPES.CLASS).toBeDefined()
      expect(SLOT_TYPES.EXAM).toBeDefined()
      expect(SLOT_TYPES.INSTRUCTOR).toBeDefined()
    })
  })

  describe('SLOT_STATUS', () => {
    it('has expected status values', () => {
      expect(SLOT_STATUS.AVAILABLE).toBe('AVAILABLE')
      expect(SLOT_STATUS.BOOKED).toBe('BOOKED')
      expect(SLOT_STATUS.CANCELLED).toBe('CANCELLED')
    })
  })

  describe('validateSlot', () => {
    it('returns valid for valid slot', () => {
      const result = validateSlot({ type: 'CLASS', start: new Date(), end: new Date(Date.now() + 3600000) })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for past start time', () => {
      const pastDate = new Date(Date.now() - 3600000)
      const result = validateSlot({ type: 'CLASS', start: pastDate, end: new Date() })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for zero duration', () => {
      const now = new Date()
      const result = validateSlot({ type: 'CLASS', start: now, end: now })
      expect(result.valid).toBe(false)
    })
  })

  describe('getSlotDuration', () => {
    it('returns duration in hours', () => {
      const start = new Date('2026-01-01T09:00:00')
      const end = new Date('2026-01-01T11:00:00')
      expect(getSlotDuration(start, end)).toBe(2)
    })

    it('returns 0 for zero duration', () => {
      const now = new Date()
      expect(getSlotDuration(now, now)).toBe(0)
    })
  })

  describe('isSlotAvailable', () => {
    it('returns true for available slot', () => {
      expect(isSlotAvailable({ status: 'AVAILABLE' })).toBe(true)
    })

    it('returns false for booked slot', () => {
      expect(isSlotAvailable({ status: 'BOOKED' })).toBe(false)
    })
  })
})
