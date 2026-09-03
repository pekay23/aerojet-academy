import { describe, it, expect } from 'vitest'
import { welcomeEmail, activationEmail, passwordResetEmail, paymentApprovedEmail, promotionToStudentEmail, poolConfirmedEmail, poolFailedEmail, examReminderEmail, contactFormEmail } from '@/lib/email/templates'

describe('lib/email/templates', () => {
  describe('welcomeEmail', () => {
    it('includes registration code', async () => {
      const result = await welcomeEmail('John', 'AERO-2026-ABC123')
      expect(result).toContain('AERO-2026-ABC123')
      expect(result).toContain('John')
    })
  })

  describe('activationEmail', () => {
    it('includes academy email and temp password', async () => {
      const result = await activationEmail('John', 'john@aerojet-academy.com', 'TempPass123')
      expect(result).toContain('john@aerojet-academy.com')
      expect(result).toContain('TempPass123')
    })
  })

  describe('passwordResetEmail', () => {
    it('includes reset link', async () => {
      const result = await passwordResetEmail('John', 'https://example.com/reset')
      expect(result).toContain('https://example.com/reset')
      expect(result).toContain('John')
    })
  })

  describe('paymentApprovedEmail', () => {
    it('includes amount and reference', async () => {
      const result = await paymentApprovedEmail('John', '500', 'REF-001')
      expect(result).toContain('500')
      expect(result).toContain('REF-001')
    })
  })

  describe('promotionToStudentEmail', () => {
    it('includes student ID and academy email', async () => {
      const result = await promotionToStudentEmail('John', 'AJA-2026-0001', 'john@aerojet-academy.com')
      expect(result).toContain('AJA-2026-0001')
      expect(result).toContain('john@aerojet-academy.com')
    })
  })

  describe('poolConfirmedEmail', () => {
    it('includes pool and module info', async () => {
      const result = await poolConfirmedEmail('John', 'Pool A', '2026-01-15', 'M1')
      expect(result).toContain('Pool A')
      expect(result).toContain('M1')
    })
  })

  describe('poolFailedEmail', () => {
    it('includes pool name and exam date', async () => {
      const result = await poolFailedEmail('John', 'Pool A', '2026-01-15')
      expect(result).toContain('Pool A')
      expect(result).toContain('2026-01-15')
    })
  })

  describe('examReminderEmail', () => {
    it('includes days until exam', async () => {
      const result = await examReminderEmail('John', 'Pool A', '2026-01-15', 3)
      expect(result).toContain('3 day')
    })
  })

  describe('contactFormEmail', () => {
    it('includes name, subject and message', async () => {
      const result = await contactFormEmail('John Doe', 'john@example.com', 'Inquiry', 'Hello there')
      expect(result).toContain('John Doe')
      expect(result).toContain('Inquiry')
      expect(result).toContain('Hello there')
    })
  })
})
