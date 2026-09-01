import { describe, it, expect } from 'vitest'
import { getNotificationType, formatNotificationMessage, isNotificationUnread, NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '@/lib/notifications/formatters'

describe('lib/notifications/formatters', () => {
  describe('NOTIFICATION_TYPES', () => {
    it('has expected types', () => {
      expect(NOTIFICATION_TYPES.INFO).toBeDefined()
      expect(NOTIFICATION_TYPES.SUCCESS).toBeDefined()
      expect(NOTIFICATION_TYPES.WARNING).toBeDefined()
      expect(NOTIFICATION_TYPES.ERROR).toBeDefined()
    })
  })

  describe('NOTIFICATION_PRIORITY', () => {
    it('has expected priority values', () => {
      expect(NOTIFICATION_PRIORITY.LOW).toBe('LOW')
      expect(NOTIFICATION_PRIORITY.MEDIUM).toBe('MEDIUM')
      expect(NOTIFICATION_PRIORITY.HIGH).toBe('HIGH')
      expect(NOTIFICATION_PRIORITY.URGENT).toBe('URGENT')
    })
  })

  describe('getNotificationType', () => {
    it('returns type by code', () => {
      expect(getNotificationType('INFO')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getNotificationType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('formatNotificationMessage', () => {
    it('returns formatted message', () => {
      const message = formatNotificationMessage('INFO', 'Test message')
      expect(typeof message).toBe('string')
      expect(message).toContain('Test message')
    })

    it('includes notification type', () => {
      const message = formatNotificationMessage('SUCCESS', 'Operation completed')
      expect(message).toContain('SUCCESS')
    })
  })

  describe('isNotificationUnread', () => {
    it('returns true for unread notification', () => {
      expect(isNotificationUnread({ read: false })).toBe(true)
    })

    it('returns false for read notification', () => {
      expect(isNotificationUnread({ read: true })).toBe(false)
    })
  })
})
