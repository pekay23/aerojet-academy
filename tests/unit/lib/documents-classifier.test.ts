import { describe, it, expect } from 'vitest'
import { classifyDocument, getDocumentType, isDocumentExpired, getDocumentExpiryStatus, DOCUMENT_TYPES } from '@/lib/documents/classifier'

describe('lib/documents/classifier', () => {
  describe('DOCUMENT_TYPES', () => {
    it('has expected document types', () => {
      expect(DOCUMENT_TYPES.PASSPORT).toBeDefined()
      expect(DOCUMENT_TYPES.ID_CARD).toBeDefined()
      expect(DOCUMENT_TYPES.CERTIFICATE).toBeDefined()
      expect(DOCUMENT_TYPES.MEDICAL).toBeDefined()
    })

    it('each type has label', () => {
      for (const [key, type] of Object.entries(DOCUMENT_TYPES)) {
        expect(type.label).toBeDefined()
        expect(typeof type.label).toBe('string')
      }
    })
  })

  describe('classifyDocument', () => {
    it('classifies passport by name', () => {
      expect(classifyDocument('passport.pdf')).toBe('PASSPORT')
    })

    it('classifies ID card by name', () => {
      expect(classifyDocument('national_id.jpg')).toBe('ID_CARD')
    })

    it('classifies medical by name', () => {
      expect(classifyDocument('medical_certificate.pdf')).toBe('MEDICAL')
    })

    it('returns null for unknown type', () => {
      expect(classifyDocument('unknown_file.txt')).toBeNull()
    })
  })

  describe('getDocumentType', () => {
    it('returns type config by code', () => {
      expect(getDocumentType('PASSPORT')).toBeDefined()
      expect(getDocumentType('PASSPORT').label).toBe('Passport')
    })

    it('returns undefined for unknown code', () => {
      expect(getDocumentType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('isDocumentExpired', () => {
    it('returns true for past expiry date', () => {
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 1)
      expect(isDocumentExpired(pastDate)).toBe(true)
    })

    it('returns false for future expiry date', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      expect(isDocumentExpired(futureDate)).toBe(false)
    })

    it('returns true for null expiry date', () => {
      expect(isDocumentExpired(null)).toBe(true)
    })
  })

  describe('getDocumentExpiryStatus', () => {
    it('returns EXPIRED for past date', () => {
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 1)
      expect(getDocumentExpiryStatus(pastDate)).toBe('EXPIRED')
    })

    it('returns EXPIRING_SOON for date within 30 days', () => {
      const soonDate = new Date()
      soonDate.setDate(soonDate.getDate() + 15)
      expect(getDocumentExpiryStatus(soonDate)).toBe('EXPIRING_SOON')
    })

    it('returns VALID for future date', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      expect(getDocumentExpiryStatus(futureDate)).toBe('VALID')
    })
  })
})
