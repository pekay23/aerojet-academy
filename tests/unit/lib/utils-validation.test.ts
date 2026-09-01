import { describe, it, expect } from 'vitest'
import { isValidEmail, isValidPhone, isValidStudentId, isValidRegistrationCode, isStrongPassword } from '@/lib/utils/validation'

describe('lib/utils/validation', () => {
  describe('isValidEmail', () => {
    it('accepts valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co')).toBe(true)
    })

    it('rejects invalid emails', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('notanemail')).toBe(false)
      expect(isValidEmail('missing@domain')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('accepts valid international phone numbers', () => {
      expect(isValidPhone('+233209848423')).toBe(true)
      expect(isValidPhone('233209848423')).toBe(true)
      expect(isValidPhone('+1 555 123 4567')).toBe(true)
    })

    it('rejects invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false)
      expect(isValidPhone('123')).toBe(false)
      expect(isValidPhone('abc')).toBe(false)
    })
  })

  describe('isValidStudentId', () => {
    it('accepts valid student IDs', () => {
      expect(isValidStudentId('AJA-2026-0001')).toBe(true)
      expect(isValidStudentId('AJA-2025-9999')).toBe(true)
    })

    it('rejects invalid student IDs', () => {
      expect(isValidStudentId('')).toBe(false)
      expect(isValidStudentId('INVALID-2026-0001')).toBe(false)
      expect(isValidStudentId('AJA-26-0001')).toBe(false)
    })
  })

  describe('isValidRegistrationCode', () => {
    it('accepts valid registration codes', () => {
      expect(isValidRegistrationCode('AERO-2026-ABC123')).toBe(true)
      expect(isValidRegistrationCode('AERO-2025-999999')).toBe(true)
    })

    it('rejects invalid registration codes', () => {
      expect(isValidRegistrationCode('')).toBe(false)
      expect(isValidRegistrationCode('INVALID-2026-ABC123')).toBe(false)
      expect(isValidRegistrationCode('AERO-26-ABC123')).toBe(false)
    })
  })

  describe('isStrongPassword', () => {
    it('returns valid for strong password', () => {
      const result = isStrongPassword('StrongPass1')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns invalid for weak password', () => {
      const result = isStrongPassword('weak')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('rejects passwords without uppercase', () => {
      const result = isStrongPassword('weakpass1')
      expect(result.errors).toContain('At least one uppercase letter')
    })

    it('rejects passwords without lowercase', () => {
      const result = isStrongPassword('WEAKPASS1')
      expect(result.errors).toContain('At least one lowercase letter')
    })

    it('rejects passwords without numbers', () => {
      const result = isStrongPassword('WeakPass')
      expect(result.errors).toContain('At least one number')
    })

    it('rejects passwords shorter than 8 characters', () => {
      const result = isStrongPassword('Short1')
      expect(result.errors).toContain('At least 8 characters')
    })
  })
})
