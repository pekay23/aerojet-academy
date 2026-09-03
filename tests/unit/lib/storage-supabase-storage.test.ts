import { describe, it, expect } from 'vitest'
import { buildStoragePath, documentCategoryFolder } from '@/lib/storage/supabase-storage'

describe('lib/storage/supabase-storage', () => {
  describe('buildStoragePath', () => {
    it('builds path with user and category', () => {
      const result = buildStoragePath({
        scope: 'students',
        ownerId: 'user-123',
        category: 'identity',
        fileName: 'file.pdf',
      })
      expect(result).toContain('user-123')
      expect(result).toContain('identity')
      expect(result).toContain('file.pdf')
    })

    it('returns string', () => {
      expect(typeof buildStoragePath({ scope: 'students', ownerId: 'u', fileName: 'f' })).toBe('string')
    })
  })

  describe('documentCategoryFolder', () => {
    it('returns folder for identity', () => {
      expect(documentCategoryFolder('identity')).toBe('identity')
    })

    it('returns folder for medical', () => {
      expect(documentCategoryFolder('medical')).toBe('medical')
    })

    it('returns misc for unknown category', () => {
      expect(documentCategoryFolder('unknown')).toBe('misc')
    })
  })
})
