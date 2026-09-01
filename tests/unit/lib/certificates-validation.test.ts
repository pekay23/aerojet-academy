import { describe, it, expect } from 'vitest'
import { getCertificateType, validateCertificate, isCertificateValid, CERTIFICATE_TYPES, CERTIFICATE_VALIDITY_YEARS } from '@/lib/certificates/validation'

describe('lib/certificates/validation', () => {
  describe('CERTIFICATE_TYPES', () => {
    it('has expected types', () => {
      expect(CERTIFICATE_TYPES.ATPL).toBeDefined()
      expect(CERTIFICATE_TYPES.CPL).toBeDefined()
      expect(CERTIFICATE_TYPES.PPL).toBeDefined()
      expect(CERTIFICATE_TYPES.MEDICAL).toBeDefined()
    })
  })

  describe('CERTIFICATE_VALIDITY_YEARS', () => {
    it('has validity for each type', () => {
      for (const [type, years] of Object.entries(CERTIFICATE_VALIDITY_YEARS)) {
        expect(years).toBeGreaterThan(0)
      }
    })
  })

  describe('getCertificateType', () => {
    it('returns type by code', () => {
      expect(getCertificateType('ATPL')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getCertificateType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('validateCertificate', () => {
    it('returns valid for valid certificate', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const result = validateCertificate('ATPL', '12345', futureDate)
      expect(result.valid).toBe(true)
    })

    it('returns invalid for expired certificate', () => {
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 1)
      const result = validateCertificate('ATPL', '12345', pastDate)
      expect(result.valid).toBe(false)
    })

    it('returns invalid for missing number', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const result = validateCertificate('ATPL', '', futureDate)
      expect(result.valid).toBe(false)
    })
  })

  describe('isCertificateValid', () => {
    it('returns true for valid certificate', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      expect(isCertificateValid(futureDate)).toBe(true)
    })

    it('returns false for expired certificate', () => {
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 1)
      expect(isCertificateValid(pastDate)).toBe(false)
    })
  })
})
