import { describe, it, expect } from 'vitest'
import { getMaterialById, getMaterialsByCourse, isMaterialDownloadable, MATERIAL_STATUS, MATERIAL_FORMATS } from '@/lib/teaching-materials/queries'

describe('lib/teaching-materials/queries', () => {
  describe('MATERIAL_STATUS', () => {
    it('has expected status values', () => {
      expect(MATERIAL_STATUS.DRAFT).toBe('DRAFT')
      expect(MATERIAL_STATUS.PUBLISHED).toBe('PUBLISHED')
      expect(MATERIAL_STATUS.ARCHIVED).toBe('ARCHIVED')
    })
  })

  describe('MATERIAL_FORMATS', () => {
    it('has expected formats', () => {
      expect(MATERIAL_FORMATS.PDF).toBe('PDF')
      expect(MATERIAL_FORMATS.VIDEO).toBe('VIDEO')
      expect(MATERIAL_FORMATS.PRESENTATION).toBe('PRESENTATION')
    })
  })

  describe('getMaterialById', () => {
    it('returns material by id', () => {
      const material = getMaterialById('material-1')
      expect(material).toBeDefined()
      expect(material?.id).toBe('material-1')
    })

    it('returns undefined for unknown id', () => {
      expect(getMaterialById('unknown')).toBeUndefined()
    })
  })

  describe('getMaterialsByCourse', () => {
    it('returns materials for course', () => {
      const materials = getMaterialsByCourse('course-1')
      expect(Array.isArray(materials)).toBe(true)
    })

    it('returns empty array for unknown course', () => {
      expect(getMaterialsByCourse('unknown')).toEqual([])
    })
  })

  describe('isMaterialDownloadable', () => {
    it('returns true for published material', () => {
      expect(isMaterialDownloadable({ status: 'PUBLISHED' })).toBe(true)
    })

    it('returns false for draft material', () => {
      expect(isMaterialDownloadable({ status: 'DRAFT' })).toBe(false)
    })

    it('returns false for archived material', () => {
      expect(isMaterialDownloadable({ status: 'ARCHIVED' })).toBe(false)
    })
  })
})
