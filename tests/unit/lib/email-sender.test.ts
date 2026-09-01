import { describe, it, expect } from 'vitest'
import { sendEmail, sendBulkEmails } from '@/lib/email/sender'

describe('lib/email/sender', () => {
  describe('sendEmail', () => {
    it('is a function', () => {
      expect(typeof sendEmail).toBe('function')
    })
  })

  describe('sendBulkEmails', () => {
    it('is a function', () => {
      expect(typeof sendBulkEmails).toBe('function')
    })
  })
})
