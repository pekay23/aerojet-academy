import { describe, it, expect } from 'vitest'
import { getRealtimeEventType, formatRealtimeEvent, isRealtimeEvent, REALTIME_EVENT_TYPES, REALTIME_CHANNEL_TYPES } from '@/lib/realtime/events'

describe('lib/realtime/events', () => {
  describe('REALTIME_EVENT_TYPES', () => {
    it('has expected event types', () => {
      expect(REALTIME_EVENT_TYPES.INSERT).toBeDefined()
      expect(REALTIME_EVENT_TYPES.UPDATE).toBeDefined()
      expect(REALTIME_EVENT_TYPES.DELETE).toBeDefined()
    })
  })

  describe('REALTIME_CHANNEL_TYPES', () => {
    it('has expected channel types', () => {
      expect(REALTIME_CHANNEL_TYPES.MESSAGES).toBeDefined()
      expect(REALTIME_CHANNEL_TYPES.NOTIFICATIONS).toBeDefined()
      expect(REALTIME_CHANNEL_TYPES.PRESENCE).toBeDefined()
    })
  })

  describe('getRealtimeEventType', () => {
    it('returns event type by code', () => {
      expect(getRealtimeEventType('INSERT')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getRealtimeEventType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('formatRealtimeEvent', () => {
    it('returns formatted event object', () => {
      const event = formatRealtimeEvent({ type: 'INSERT', table: 'messages', record: { id: '1' } })
      expect(event).toBeDefined()
      expect(event.type).toBe('INSERT')
    })

    it('includes timestamp', () => {
      const event = formatRealtimeEvent({ type: 'INSERT', table: 'messages', record: { id: '1' } })
      expect(event.timestamp).toBeDefined()
    })
  })

  describe('isRealtimeEvent', () => {
    it('returns true for valid event', () => {
      expect(isRealtimeEvent({ type: 'INSERT', table: 'messages', record: {} })).toBe(true)
    })

    it('returns false for invalid event', () => {
      expect(isRealtimeEvent({ type: 'UNKNOWN', table: 'messages', record: {} })).toBe(false)
    })
  })
})
