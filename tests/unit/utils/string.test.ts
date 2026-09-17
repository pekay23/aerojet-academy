import { describe, it, expect } from 'vitest'
import {
  capitalize,
  toTitleCase,
  truncate,
  slugify,
  getInitials,
  maskEmail,
  formatPaymentType,
} from '@/lib/utils/string'

describe('String Utilities', () => {
  // ─── capitalize ──────────────────────────────────────────────────
  describe('capitalize', () => {
    it('capitalizes the first letter and lowercases the rest', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('World')
      expect(capitalize('mIxEd')).toBe('Mixed')
    })

    it('handles single character strings', () => {
      expect(capitalize('a')).toBe('A')
    })

    it('handles empty strings', () => {
      expect(capitalize('')).toBe('')
    })
  })

  // ─── toTitleCase ─────────────────────────────────────────────────
  describe('toTitleCase', () => {
    it('converts a string to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World')
      expect(toTitleCase('THE QUICK BROWN FOX')).toBe('The Quick Brown Fox')
    })

    it('handles multiple spaces', () => {
      expect(toTitleCase('hello   world')).toBe('Hello   World')
    })

    it('handles empty strings', () => {
      expect(toTitleCase('')).toBe('')
    })
  })

  // ─── truncate ────────────────────────────────────────────────────
  describe('truncate', () => {
    it('returns the original string when under max length', () => {
      expect(truncate('hello', 10)).toBe('hello')
    })

    it('truncates and adds ellipsis when over max length', () => {
      expect(truncate('hello world', 5)).toBe('hello...')
    })

    it('uses default max length of 100', () => {
      const longStr = 'a'.repeat(150)
      expect(truncate(longStr)).toBe('a'.repeat(100) + '...')
    })

    it('returns empty string for empty input', () => {
      expect(truncate('')).toBe('')
    })
  })

  // ─── slugify ─────────────────────────────────────────────────────
  describe('slugify', () => {
    it('converts spaces to hyphens and lowercases', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('removes special characters', () => {
      expect(slugify('Hello! World?')).toBe('hello-world')
    })

    it('collapses multiple hyphens', () => {
      expect(slugify('Hello---World')).toBe('hello-world')
    })

    it('trims whitespace', () => {
      expect(slugify('  hello world  ')).toBe('hello-world')
    })

    it('returns empty string for falsy input', () => {
      expect(slugify('')).toBe('')
      expect(slugify(null as any)).toBe('')
    })
  })

  // ─── getInitials ─────────────────────────────────────────────────
  describe('getInitials', () => {
    it('returns uppercase initials', () => {
      expect(getInitials('John', 'Doe')).toBe('JD')
    })

    it('handles lowercase names', () => {
      expect(getInitials('john', 'doe')).toBe('JD')
    })
  })

  // ─── maskEmail ───────────────────────────────────────────────────
  describe('maskEmail', () => {
    it('masks most of the local part', () => {
      expect(maskEmail('john.doe@example.com')).toBe('jo***@example.com')
    })

    it('handles short local parts (<=2 chars)', () => {
      expect(maskEmail('ab@example.com')).toBe('a***@example.com')
    })

    it('preserves the domain', () => {
      expect(maskEmail('test@aerojet-academy.com')).toBe('te***@aerojet-academy.com')
    })
  })

  // ─── formatPaymentType ───────────────────────────────────────────
  describe('formatPaymentType', () => {
    it('returns "Payment" for empty string', () => {
      expect(formatPaymentType('')).toBe('Payment')
    })

    it('maps known payment types', () => {
      expect(formatPaymentType('WALLET_TOP_UP')).toBe('Wallet Top-Up')
      expect(formatPaymentType('REGISTRATION')).toBe('Registration Fee')
      expect(formatPaymentType('COURSE')).toBe('Course Enrollment')
      expect(formatPaymentType('EXAM_BOOKING')).toBe('Exam Booking')
      expect(formatPaymentType('TUITION')).toBe('Tuition Fee')
      expect(formatPaymentType('RESIT')).toBe('Exam Resit')
    })

    it('normalizes underscores and casing', () => {
      expect(formatPaymentType('registration_fee')).toBe('Registration Fee')
      expect(formatPaymentType('full_programme')).toBe('Full Programme Payment')
    })

    it('falls back to title case for unknown types', () => {
      expect(formatPaymentType('CUSTOM_TYPE')).toBe('Custom Type')
    })
  })
})
