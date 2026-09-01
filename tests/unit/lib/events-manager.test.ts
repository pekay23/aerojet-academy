import { describe, it, expect } from 'vitest'
import { createEvent, updateEvent, deleteEvent, getEvent, EVENT_TYPES, EVENT_STATUS } from '@/lib/events/manager'

describe('lib/events/manager', () => {
  describe('EVENT_TYPES', () => {
    it('has expected types', () => {
      expect(EVENT_TYPES.OPEN_DAY).toBeDefined()
      expect(EVENT_TYPES.WORKSHOP).toBeDefined()
      expect(EVENT_TYPES.SEMINAR).toBeDefined()
    })
  })

  describe('EVENT_STATUS', () => {
    it('has expected status values', () => {
      expect(EVENT_STATUS.DRAFT).toBe('DRAFT')
      expect(EVENT_STATUS.PUBLISHED).toBe('PUBLISHED')
      expect(EVENT_STATUS.CANCELLED).toBe('CANCELLED')
    })
  })

  describe('createEvent', () => {
    it('returns event object', () => {
      const event = createEvent({ title: 'Open Day', type: 'OPEN_DAY', date: new Date() })
      expect(event).toBeDefined()
      expect(event.title).toBe('Open Day')
    })

    it('sets default status', () => {
      const event = createEvent({ title: 'Open Day', type: 'OPEN_DAY', date: new Date() })
      expect(event.status).toBe('DRAFT')
    })

    it('generates event id', () => {
      const event = createEvent({ title: 'Open Day', type: 'OPEN_DAY', date: new Date() })
      expect(event.id).toBeDefined()
      expect(typeof event.id).toBe('string')
    })
  })

  describe('updateEvent', () => {
    it('updates event fields', () => {
      const event = createEvent({ title: 'Open Day', type: 'OPEN_DAY', date: new Date() })
      const updated = updateEvent(event.id, { title: 'Updated Open Day' })
      expect(updated.title).toBe('Updated Open Day')
    })

    it('preserves id', () => {
      const event = createEvent({ title: 'Open Day', type: 'OPEN_DAY', date: new Date() })
      const updated = updateEvent(event.id, { title: 'Updated Open Day' })
      expect(updated.id).toBe(event.id)
    })
  })

  describe('deleteEvent', () => {
    it('returns true on successful delete', () => {
      const event = createEvent({ title: 'Open Day', type: 'OPEN_DAY', date: new Date() })
      expect(deleteEvent(event.id)).toBe(true)
    })

    it('returns false for nonexistent event', () => {
      expect(deleteEvent('nonexistent')).toBe(false)
    })
  })

  describe('getEvent', () => {
    it('returns event by id', () => {
      const event = createEvent({ title: 'Open Day', type: 'OPEN_DAY', date: new Date() })
      const found = getEvent(event.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(event.id)
    })

    it('returns undefined for unknown id', () => {
      expect(getEvent('unknown')).toBeUndefined()
    })
  })
})
