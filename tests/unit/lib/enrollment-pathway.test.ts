import { describe, it, expect } from 'vitest'
import { mapProgrammeChoiceToPathwayCode, resolveEnrollmentType, getCatalogVisibility, canAccessMaterials, canAccessClasses, shouldPromoteOnPayment, resolveEffectivePathwayCode, resolveEffectiveEnrollmentType } from '@/lib/enrollment/pathway'

describe('lib/enrollment/pathway', () => {
  describe('mapProgrammeChoiceToPathwayCode', () => {
    it('maps FULL_TIME_4YEAR correctly', () => {
      expect(mapProgrammeChoiceToPathwayCode('FULL_TIME_4YEAR')).toBe('FULL_TIME_4Y')
    })

    it('maps FULL_TIME_2YEAR correctly', () => {
      expect(mapProgrammeChoiceToPathwayCode('FULL_TIME_2YEAR')).toBe('FULL_TIME_2Y')
    })

    it('maps MILITARY_1YEAR correctly', () => {
      expect(mapProgrammeChoiceToPathwayCode('MILITARY_1YEAR')).toBe('MILITARY_1Y')
    })

    it('maps MODULAR correctly', () => {
      expect(mapProgrammeChoiceToPathwayCode('MODULAR')).toBe('MODULAR')
    })

    it('maps EXAM_ONLY correctly', () => {
      expect(mapProgrammeChoiceToPathwayCode('EXAM_ONLY')).toBe('EXAM_ONLY')
    })

    it('returns MODULAR for unknown choice', () => {
      expect(mapProgrammeChoiceToPathwayCode('UNKNOWN')).toBe('MODULAR')
    })
  })

  describe('resolveEnrollmentType', () => {
    it('resolves FULL_TIME_4YEAR to FULL_TIME', () => {
      expect(resolveEnrollmentType('FULL_TIME_4YEAR')).toBe('FULL_TIME')
    })

    it('resolves FULL_TIME_2YEAR to FULL_TIME', () => {
      expect(resolveEnrollmentType('FULL_TIME_2YEAR')).toBe('FULL_TIME')
    })

    it('resolves MILITARY_1YEAR to FULL_TIME', () => {
      expect(resolveEnrollmentType('MILITARY_1YEAR')).toBe('FULL_TIME')
    })

    it('resolves MODULAR to MODULAR', () => {
      expect(resolveEnrollmentType('MODULAR')).toBe('MODULAR')
    })

    it('resolves EXAM_ONLY to EXAM_ONLY', () => {
      expect(resolveEnrollmentType('EXAM_ONLY')).toBe('EXAM_ONLY')
    })

    it('returns SHORT_COURSE for unknown', () => {
      expect(resolveEnrollmentType('UNKNOWN' as any)).toBe('SHORT_COURSE')
    })
  })

  describe('getCatalogVisibility', () => {
    it('shows everything for null enrollment type', () => {
      const vis = getCatalogVisibility(null)
      expect(vis.showEasaModules).toBe(true)
      expect(vis.canPurchaseEasaModules).toBe(true)
    })

    it('hides EASA modules for FULL_TIME students', () => {
      const vis = getCatalogVisibility('FULL_TIME')
      expect(vis.showEasaModules).toBe(false)
      expect(vis.canPurchaseEasaModules).toBe(false)
    })

    it('shows exam-only variants for EXAM_ONLY', () => {
      const vis = getCatalogVisibility('EXAM_ONLY')
      expect(vis.showExamOnlyVariants).toBe(true)
    })

    it('does not allow EXAM_ONLY to purchase EASA modules', () => {
      const vis = getCatalogVisibility('EXAM_ONLY')
      expect(vis.canPurchaseEasaModules).toBe(false)
    })
  })

  describe('canAccessMaterials', () => {
    it('returns true for all enrollment types', () => {
      expect(canAccessMaterials('FULL_TIME')).toBe(true)
      expect(canAccessMaterials('MODULAR')).toBe(true)
      expect(canAccessMaterials('EXAM_ONLY')).toBe(true)
    })
  })

  describe('canAccessClasses', () => {
    it('returns true for non-exam-only students', () => {
      expect(canAccessClasses('FULL_TIME')).toBe(true)
      expect(canAccessClasses('MODULAR')).toBe(true)
    })

    it('returns false for exam-only students', () => {
      expect(canAccessClasses('EXAM_ONLY')).toBe(false)
    })
  })

  describe('shouldPromoteOnPayment', () => {
    it('returns true for SEAT_CONFIRMATION on FULL_TIME', () => {
      expect(shouldPromoteOnPayment('FULL_TIME_4YEAR', 'SEAT_CONFIRMATION')).toBe(true)
    })

    it('returns true for COURSE on MODULAR', () => {
      expect(shouldPromoteOnPayment('MODULAR', 'COURSE')).toBe(true)
    })

    it('returns true for EXAM on EXAM_ONLY', () => {
      expect(shouldPromoteOnPayment('EXAM_ONLY', 'EXAM')).toBe(true)
    })

    it('returns false for non-trigger payments', () => {
      expect(shouldPromoteOnPayment('FULL_TIME_4YEAR', 'WALLET_TOP_UP')).toBe(false)
    })
  })

  describe('resolveEffectivePathwayCode', () => {
    it('prefers pathwayCode', () => {
      expect(resolveEffectivePathwayCode({ pathwayCode: 'EXAM_ONLY', programmeChoice: 'FULL_TIME_4YEAR' })).toBe('EXAM_ONLY')
    })

    it('falls back to programmeChoice', () => {
      expect(resolveEffectivePathwayCode({ programmeChoice: 'FULL_TIME_4YEAR' })).toBe('FULL_TIME_4Y')
    })

    it('falls back to enrollmentType', () => {
      expect(resolveEffectivePathwayCode({ enrollmentType: 'EXAM_ONLY' })).toBe('EXAM_ONLY')
    })
  })
})
