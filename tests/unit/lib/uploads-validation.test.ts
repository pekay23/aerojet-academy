import { describe, it, expect } from 'vitest'
import { validateFileType, validateFileSize, getFileExtension, sanitizeFilename } from '@/lib/uploads/validation'

describe('lib/uploads/validation', () => {
  describe('validateFileType', () => {
    it('returns true for valid image type', () => {
      expect(validateFileType({ type: 'image/jpeg' }, 'image')).toBe(true)
    })

    it('returns false for invalid image type', () => {
      expect(validateFileType({ type: 'application/pdf' }, 'image')).toBe(false)
    })

    it('returns true for valid document type', () => {
      expect(validateFileType({ type: 'application/pdf' }, 'document')).toBe(true)
    })

    it('returns true for any category', () => {
      expect(validateFileType({ type: 'image/png' }, 'any')).toBe(true)
    })
  })

  describe('validateFileSize', () => {
    it('returns true for size within limit', () => {
      expect(validateFileSize(1024 * 1024, 1)).toBe(true)
    })

    it('returns false for size exceeding limit', () => {
      expect(validateFileSize(2 * 1024 * 1024, 1)).toBe(false)
    })

    it('returns true for exact limit', () => {
      expect(validateFileSize(1 * 1024 * 1024, 1)).toBe(true)
    })
  })

  describe('getFileExtension', () => {
    it('returns extension', () => {
      expect(getFileExtension('file.pdf')).toBe('pdf')
    })

    it('returns empty string for no extension', () => {
      expect(getFileExtension('file.')).toBe('')
    })

    it('returns lowercase extension', () => {
      expect(getFileExtension('file.PDF')).toBe('pdf')
    })
  })

  describe('sanitizeFilename', () => {
    it('removes special characters', () => {
      expect(sanitizeFilename('file name (1).pdf')).toBe('file_name__1_.pdf')
    })

    it('returns lowercase', () => {
      expect(sanitizeFilename('File.PDF')).toBe('file.pdf')
    })
  })
})
