import { describe, it, expect } from 'vitest'
import { formatRealtimeMessage, getMessageType, isMessageFromUser, MESSAGE_TYPES, MESSAGE_STATUS } from '@/lib/realtime/messages'

describe('lib/realtime/messages', () => {
  describe('MESSAGE_TYPES', () => {
    it('has expected types', () => {
      expect(MESSAGE_TYPES.TEXT).toBeDefined()
      expect(MESSAGE_TYPES.IMAGE).toBeDefined()
      expect(MESSAGE_TYPES.FILE).toBeDefined()
      expect(MESSAGE_TYPES.SYSTEM).toBeDefined()
    })
  })

  describe('MESSAGE_STATUS', () => {
    it('has expected status values', () => {
      expect(MESSAGE_STATUS.SENT).toBe('SENT')
      expect(MESSAGE_STATUS.DELIVERED).toBe('DELIVERED')
      expect(MESSAGE_STATUS.READ).toBe('READ')
      expect(MESSAGE_STATUS.FAILED).toBe('FAILED')
    })
  })

  describe('formatRealtimeMessage', () => {
    it('returns formatted message object', () => {
      const message = formatRealtimeMessage({ id: '1', text: 'Hello', senderId: 'user-1', recipientId: 'user-2', timestamp: Date.now() })
      expect(message).toBeDefined()
      expect(message.text).toBe('Hello')
    })

    it('includes formatted timestamp', () => {
      const timestamp = Date.now()
      const message = formatRealtimeMessage({ id: '1', text: 'Hello', senderId: 'user-1', recipientId: 'user-2', timestamp })
      expect(message.formattedTime).toBeDefined()
    })
  })

  describe('getMessageType', () => {
    it('returns type by code', () => {
      expect(getMessageType('TEXT')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getMessageType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('isMessageFromUser', () => {
    it('returns true for message from user', () => {
      expect(isMessageFromUser({ senderId: 'user-1' }, 'user-1')).toBe(true)
    })

    it('returns false for message from other user', () => {
      expect(isMessageFromUser({ senderId: 'user-2' }, 'user-1')).toBe(false)
    })
  })
})
