import { describe, it, expect } from 'vitest'
import { validateDocument, getDocumentStatus, isDocumentExpired as isDocExpired, getDocumentType as getDocType, DOCUMENT_TYPES, DOCUMENT_STATUS } from '@/lib/documents/validation'

describe('lib/documents/validation', () => {
  describe('DOCUMENT_TYPES', () => {
    it('has expected types', () => {
      expect(DOCUMENT_TYPES.PASSPORT).toBeDefined()
      expect(DOCUMENT_TYPES.ID_CARD).toBeDefined()
      expect(DOCUMENT_TYPES.CERTIFICATE).toBeDefined()
    })
  })

  describe('DOCUMENT_STATUS', () => {
    it('has expected status values', () => {
      expect(DOCUMENT_STATUS.PENDING).toBe('PENDING')
      expect(DOCUMENT_STATUS.VERIFIED).toBe('VERIFIED')
      expect(DOCUMENT_STATUS.REJECTED).toBe('REJECTED')
      expect(DOCUMENT_STATUS.EXPIRED).toBe('EXPIRED')
    })
  })

  describe('validateDocument', () => {
    it('returns valid for valid document', () => {
      const result = validateDocument({ type: 'PASSPORT', number: 'A12345678', expiry: new Date(Date.now() + 86400000 * 365) })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for missing type', () => {
      const result = validateDocument({ number: 'A12345678', expiry: new Date() })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for missing number', () => {
      const result = validateDocument({ type: 'PASSPORT', expiry: new Date() })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for expired document', () => {
      const result = validateDocument({ type: 'PASSPORT', number: 'A12345678', expiry: new Date(Date.now() - 86400000) })
      expect(result.valid).toBe(false)
    })
  })

  describe('getDocumentStatus', () => {
    it('returns VERIFIED for verified document', () => {
      expect(getDocumentStatus({ status: 'VERIFIED' })).toBe('VERIFIED')
    })

    it('returns EXPIRED for expired document', () => {
      expect(getDocumentStatus({ status: 'VERIFIED', expiry: new Date(Date.now() - 86400000) })).toBe('EXPIRED')
    })
  })

  describe('isDocumentExpired', () => {
    it('returns true for past expiry date', () => {
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 1)
      expect(isDocExpired(pastDate)).toBe(true)
    })

    it('returns false for future expiry date', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      expect(isDocExpired(futureDate)).toBe(false)
    })
  })

  describe('getDocumentType', () => {
    it('returns type by code', () => {
      expect(getDocType('PASSPORT')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getDocType('UNKNOWN')).toBeUndefined()
    })
  })
})
