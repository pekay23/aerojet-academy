import { describe, it, expect } from 'vitest'
import { formatCertificateNumber, validateCertificateNumber, CERTIFICATE_NUMBER_PREFIX, CERTIFICATE_NUMBER_LENGTH } from '@/lib/certificates/formatters'

describe('lib/certificates/formatters', () => {
  describe('CERTIFICATE_NUMBER_PREFIX', () => {
    it('is a string', () => {
      expect(typeof CERTIFICATE_NUMBER_PREFIX).toBe('string')
    })

    it('has length greater than 0', () => {
      expect(CERTIFICATE_NUMBER_PREFIX.length).toBeGreaterThan(0)
    })
  })

  describe('CERTIFICATE_NUMBER_LENGTH', () => {
    it('is a positive number', () => {
      expect(CERTIFICATE_NUMBER_LENGTH).toBeGreaterThan(0)
    })
  })

  describe('formatCertificateNumber', () => {
    it('returns string', () => {
      expect(typeof formatCertificateNumber(12345)).toBe('string')
    })

    it('includes prefix', () => {
      expect(formatCertificateNumber(12345)).toContain(CERTIFICATE_NUMBER_PREFIX)
    })

    it('pads to correct length', () => {
      const formatted = formatCertificateNumber(1)
      expect(formatted.length).toBeGreaterThanOrEqual(CERTIFICATE_NUMBER_LENGTH)
    })
  })

  describe('validateCertificateNumber', () => {
    it('returns true for valid format', () => {
      expect(validateCertificateNumber(formatCertificateNumber(12345))).toBe(true)
    })

    it('returns false for invalid format', () => {
      expect(validateCertificateNumber('INVALID')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(validateCertificateNumber('')).toBe(false)
    })
  })
})
