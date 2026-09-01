import { describe, it, expect } from 'vitest'
import { getLicenseCategory, getLicenseSubcategory, getLicenseFullName, LICENSE_CATEGORIES, LICENSE_SUBCATEGORIES } from '@/lib/license/categories'

describe('lib/license/categories', () => {
  describe('LICENSE_CATEGORIES', () => {
    it('has expected categories', () => {
      expect(LICENSE_CATEGORIES.PPL).toBeDefined()
      expect(LICENSE_CATEGORIES.CPL).toBeDefined()
      expect(LICENSE_CATEGORIES.ATPL).toBeDefined()
    })

    it('each category has name and description', () => {
      for (const [key, cat] of Object.entries(LICENSE_CATEGORIES)) {
        expect(cat.name).toBeDefined()
        expect(cat.description).toBeDefined()
      }
    })
  })

  describe('LICENSE_SUBCATEGORIES', () => {
    it('has expected subcategories', () => {
      expect(LICENSE_SUBCATEGORIES.SINGLE_ENGINE).toBeDefined()
      expect(LICENSE_SUBCATEGORIES.MULTI_ENGINE).toBeDefined()
      expect(LICENSE_SUBCATEGORIES.INSTRUMENT).toBeDefined()
    })
  })

  describe('getLicenseCategory', () => {
    it('returns category by code', () => {
      expect(getLicenseCategory('PPL')).toBeDefined()
      expect(getLicenseCategory('PPL').name).toBe('Private Pilot License')
    })

    it('returns undefined for unknown code', () => {
      expect(getLicenseCategory('UNKNOWN')).toBeUndefined()
    })
  })

  describe('getLicenseSubcategory', () => {
    it('returns subcategory by code', () => {
      expect(getLicenseSubcategory('SINGLE_ENGINE')).toBeDefined()
      expect(getLicenseSubcategory('SINGLE_ENGINE').name).toBe('Single Engine')
    })

    it('returns undefined for unknown code', () => {
      expect(getLicenseSubcategory('UNKNOWN')).toBeUndefined()
    })
  })

  describe('getLicenseFullName', () => {
    it('returns combined name', () => {
      const fullName = getLicenseFullName('PPL', 'SINGLE_ENGINE')
      expect(fullName).toContain('PPL')
      expect(fullName).toContain('Single Engine')
    })

    it('returns category name when no subcategory', () => {
      const fullName = getLicenseFullName('PPL', null)
      expect(fullName).toBe('Private Pilot License')
    })
  })
})
