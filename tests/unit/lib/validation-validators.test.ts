import { describe, it, expect } from 'vitest'
import { validateEmail, validatePhone, sanitizeInput, formatName } from '@/lib/validation/validators'

describe('lib/validation/validators', () => {
  describe('validateEmail', () => {
    it('returns true for valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user@domain.co')).toBe(true)
    })

    it('returns false for invalid email', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('returns true for valid phone numbers', () => {
      expect(validatePhone('+254700000000')).toBe(true)
      expect(validatePhone('0700000000')).toBe(true)
    })

    it('returns false for invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('abcdefghij')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('removes HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<script>')
    })

    it('trims whitespace', () => {
      expect(sanitizeInput('  spaced  ')).toBe('spaced')
    })

    it('returns empty string for null input', () => {
      expect(sanitizeInput(null)).toBe('')
    })
  })

  describe('formatName', () => {
    it('capitalizes first letter', () => {
      expect(formatName('john')).toBe('John')
    })

    it('handles multiple words', () => {
      expect(formatName('john doe')).toBe('John Doe')
    })

    it('returns empty string for null input', () => {
      expect(formatName(null)).toBe('')
    })
  })
})
