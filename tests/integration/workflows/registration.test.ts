import { describe, it, expect } from 'vitest'
import {
  isValidRegistrationCode,
  isValidEmail,
  isValidPhone,
  isValidStudentId,
  isStrongPassword,
} from '@/lib/utils/validation'

describe('Registration Validation', () => {
  describe('isValidRegistrationCode', () => {
    it('accepts valid AERO-YYYY-XXXXXX format', () => {
      expect(isValidRegistrationCode('AERO-2026-A1B2C3')).toBe(true)
      expect(isValidRegistrationCode('AERO-2025-ABC123')).toBe(true)
      expect(isValidRegistrationCode('AERO-2030-Z9Y8X7')).toBe(true)
    })

    it('rejects invalid formats', () => {
      expect(isValidRegistrationCode('INVALID')).toBe(false)
      expect(isValidRegistrationCode('AERO-2026-abc123')).toBe(false) // lowercase
      expect(isValidRegistrationCode('AERO-26-A1B2C3')).toBe(false) // 2-digit year
      expect(isValidRegistrationCode('AERO-2026-A1B')).toBe(false) // too short
      expect(isValidRegistrationCode('AERO-2026-A1B2C3D')).toBe(false) // too long
      expect(isValidRegistrationCode('')).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('accepts standard email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.com')).toBe(true)
      expect(isValidEmail('a@b.co')).toBe(true)
    })

    it('rejects malformed emails', () => {
      expect(isValidEmail('notanemail')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('test@.com')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('accepts international phone numbers', () => {
      expect(isValidPhone('+233241234567')).toBe(true)
      expect(isValidPhone('0241234567')).toBe(true)
      expect(isValidPhone('+1 234 567 8900')).toBe(true)
      expect(isValidPhone('+44 20 7946 0958')).toBe(true)
    })

    it('rejects invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false)
      expect(isValidPhone('')).toBe(false)
      expect(isValidPhone('abcdefgh')).toBe(false)
    })
  })

  describe('isValidStudentId', () => {
    it('accepts valid AJA-YYYY-NNNN format', () => {
      expect(isValidStudentId('AJA-2026-0001')).toBe(true)
      expect(isValidStudentId('AJA-2025-1234')).toBe(true)
      expect(isValidStudentId('AJA-2030-9999')).toBe(true)
    })

    it('rejects invalid student IDs', () => {
      expect(isValidStudentId('INVALID')).toBe(false)
      expect(isValidStudentId('AJA-26-0001')).toBe(false)
      expect(isValidStudentId('AJA-2026-00001')).toBe(false) // 5 digits
      expect(isValidStudentId('')).toBe(false)
    })
  })

  describe('isStrongPassword', () => {
    it('accepts passwords meeting all criteria', () => {
      const result = isStrongPassword('Abc12345')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('accepts complex passwords', () => {
      expect(isStrongPassword('MyP@ss1!').valid).toBe(true)
      expect(isStrongPassword('Str0ngP4ss').valid).toBe(true)
    })

    it('rejects passwords shorter than 8 characters', () => {
      const result = isStrongPassword('Ab1')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least 8 characters')
    })

    it('requires at least one uppercase letter', () => {
      const result = isStrongPassword('abcdefg1')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one uppercase letter')
    })

    it('requires at least one lowercase letter', () => {
      const result = isStrongPassword('ABCDEFG1')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one lowercase letter')
    })

    it('requires at least one number', () => {
      const result = isStrongPassword('Abcdefgh')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one number')
    })

    it('accumulates all failing rules', () => {
      const result = isStrongPassword('ab')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(3)
    })
  })
})
