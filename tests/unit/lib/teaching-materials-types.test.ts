import { describe, it, expect } from 'vitest'
import { getMaterialType, isMaterialAccessible, getMaterialDownloadUrl, formatMaterialSize, MATERIAL_TYPES, MATERIAL_ACCESS_LEVELS } from '@/lib/teaching-materials/types'

describe('lib/teaching-materials/types', () => {
  describe('MATERIAL_TYPES', () => {
    it('has expected types', () => {
      expect(MATERIAL_TYPES.PDF).toBeDefined()
      expect(MATERIAL_TYPES.VIDEO).toBeDefined()
      expect(MATERIAL_TYPES.PRESENTATION).toBeDefined()
      expect(MATERIAL_TYPES.WORKSHEET).toBeDefined()
    })

    it('each type has extension', () => {
      for (const [key, type] of Object.entries(MATERIAL_TYPES)) {
        expect(type.extension).toBeDefined()
        expect(typeof type.extension).toBe('string')
      }
    })
  })

  describe('MATERIAL_ACCESS_LEVELS', () => {
    it('has expected levels', () => {
      expect(MATERIAL_ACCESS_LEVELS.PUBLIC).toBeDefined()
      expect(MATERIAL_ACCESS_LEVELS.STUDENT).toBeDefined()
      expect(MATERIAL_ACCESS_LEVELS.INSTRUCTOR).toBeDefined()
      expect(MATERIAL_ACCESS_LEVELS.ADMIN).toBeDefined()
    })
  })

  describe('getMaterialType', () => {
    it('returns type by code', () => {
      expect(getMaterialType('PDF')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getMaterialType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('isMaterialAccessible', () => {
    it('returns true for public material', () => {
      expect(isMaterialAccessible('PUBLIC', 'STUDENT')).toBe(true)
    })

    it('returns true for student material to student', () => {
      expect(isMaterialAccessible('STUDENT', 'STUDENT')).toBe(true)
    })

    it('returns false for instructor material to student', () => {
      expect(isMaterialAccessible('INSTRUCTOR', 'STUDENT')).toBe(false)
    })

    it('returns true for admin material to admin', () => {
      expect(isMaterialAccessible('ADMIN', 'ADMIN')).toBe(true)
    })
  })

  describe('getMaterialDownloadUrl', () => {
    it('returns string URL', () => {
      expect(typeof getMaterialDownloadUrl('file-123')).toBe('string')
    })

    it('includes file id', () => {
      expect(getMaterialDownloadUrl('file-123')).toContain('file-123')
    })
  })

  describe('formatMaterialSize', () => {
    it('formats bytes to KB', () => {
      expect(formatMaterialSize(1024)).toContain('KB')
    })

    it('formats bytes to MB', () => {
      expect(formatMaterialSize(1048576)).toContain('MB')
    })

    it('formats bytes to GB', () => {
      expect(formatMaterialSize(1073741824)).toContain('GB')
    })
  })
})
