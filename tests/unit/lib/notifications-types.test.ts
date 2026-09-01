import { describe, it, expect } from 'vitest'
import { shouldNotifyStudent, getNotificationTitle, getNotificationBody, NOTIFICATION_TYPES } from '@/lib/notifications/types'

describe('lib/notifications/types', () => {
  describe('NOTIFICATION_TYPES', () => {
    it('has expected notification types', () => {
      expect(NOTIFICATION_TYPES.PAYMENT).toBeDefined()
      expect(NOTIFICATION_TYPES.ENROLLMENT).toBeDefined()
      expect(NOTIFICATION_TYPES.EXAM).toBeDefined()
      expect(NOTIFICATION_TYPES.CLASS).toBeDefined()
    })
  })

  describe('shouldNotifyStudent', () => {
    it('returns true for enrollment notifications', () => {
      expect(shouldNotifyStudent('enrollment', 'STUDENT')).toBe(true)
    })

    it('returns false for admin-only notifications', () => {
      expect(shouldNotifyStudent('system_alert', 'STUDENT')).toBe(false)
    })

    it('returns false for null role', () => {
      expect(shouldNotifyStudent('enrollment', null)).toBe(false)
    })
  })

  describe('getNotificationTitle', () => {
    it('returns title for payment notification', () => {
      expect(getNotificationTitle('payment', 'en')).toBeDefined()
    })

    it('returns title for enrollment notification', () => {
      expect(getNotificationTitle('enrollment', 'en')).toBeDefined()
    })

    it('returns generic title for unknown type', () => {
      expect(getNotificationTitle('unknown_type', 'en')).toBeDefined()
    })
  })

  describe('getNotificationBody', () => {
    it('returns body string', () => {
      expect(typeof getNotificationBody('payment', 'en')).toBe('string')
    })

    it('returns non-empty string', () => {
      expect(getNotificationBody('enrollment', 'en').length).toBeGreaterThan(0)
    })
  })
})
