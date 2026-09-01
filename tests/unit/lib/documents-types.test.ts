import { describe, it, expect } from 'vitest'
import { getDocumentCategory, validateDocumentUpload, getDocumentSize, formatDocumentSize, DOCUMENT_CATEGORIES, DOCUMENT_SIZE_LIMITS } from '@/lib/documents/types'

describe('lib/documents/types', () => {
  describe('DOCUMENT_CATEGORIES', () => {
    it('has expected categories', () => {
      expect(DOCUMENT_CATEGORIES.PASSPORT).toBeDefined()
      expect(DOCUMENT_CATEGORIES.ID_CARD).toBeDefined()
      expect(DOCUMENT_CATEGORIES.CERTIFICATE).toBeDefined()
      expect(DOCUMENT_CATEGORIES.MEDICAL).toBeDefined()
    })
  })

  describe('DOCUMENT_SIZE_LIMITS', () => {
    it('has size limit for each category', () => {
      for (const [category, limit] of Object.entries(DOCUMENT_SIZE_LIMITS)) {
        expect(limit).toBeGreaterThan(0)
      }
    })
  })

  describe('getDocumentCategory', () => {
    it('returns category by code', () => {
      expect(getDocumentCategory('PASSPORT')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getDocumentCategory('UNKNOWN')).toBeUndefined()
    })
  })

  describe('validateDocumentUpload', () => {
    it('returns valid for valid upload', () => {
      const result = validateDocumentUpload({ category: 'PASSPORT', size: 1024 * 1024, type: 'application/pdf' })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for file too large', () => {
      const result = validateDocumentUpload({ category: 'PASSPORT', size: 100 * 1024 * 1024, type: 'application/pdf' })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for missing category', () => {
      const result = validateDocumentUpload({ size: 1024, type: 'application/pdf' })
      expect(result.valid).toBe(false)
    })
  })

  describe('getDocumentSize', () => {
    it('returns size in bytes', () => {
      expect(getDocumentSize('1MB')).toBe(1024 * 1024)
    })

    it('returns size in KB', () => {
      expect(getDocumentSize('1KB')).toBe(1024)
    })
  })

  describe('formatDocumentSize', () => {
    it('formats bytes to KB', () => {
      expect(formatDocumentSize(1024)).toContain('KB')
    })

    it('formats bytes to MB', () => {
      expect(formatDocumentSize(1048576)).toContain('MB')
    })
  })
})
