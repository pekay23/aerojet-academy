import { describe, it, expect } from 'vitest'
import { getEasaSubject, getEasaModule, calculateModuleDuration, EASA_SUBJECTS, EASA_MODULES, MODULE_DURATIONS } from '@/lib/easa/modules'

describe('lib/easa/modules', () => {
  describe('EASA_SUBJECTS', () => {
    it('has expected subjects', () => {
      expect(EASA_SUBJECTS.AIR_LAW).toBeDefined()
      expect(EASA_SUBJECTS.NAVIGATION).toBeDefined()
      expect(EASA_SUBJECTS.METEOROLOGY).toBeDefined()
      expect(EASA_SUBJECTS.AIRCRAFT).toBeDefined()
    })
  })

  describe('EASA_MODULES', () => {
    it('has expected modules', () => {
      expect(EASA_MODULES.ATPL).toBeDefined()
      expect(EASA_MODULES.CPL).toBeDefined()
      expect(EASA_MODULES.PPL).toBeDefined()
    })
  })

  describe('MODULE_DURATIONS', () => {
    it('has duration for each module', () => {
      for (const [module, duration] of Object.entries(MODULE_DURATIONS)) {
        expect(duration).toBeGreaterThan(0)
      }
    })
  })

  describe('getEasaSubject', () => {
    it('returns subject by code', () => {
      expect(getEasaSubject('AIR_LAW')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getEasaSubject('UNKNOWN')).toBeUndefined()
    })
  })

  describe('getEasaModule', () => {
    it('returns module by code', () => {
      expect(getEasaModule('ATPL')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getEasaModule('UNKNOWN')).toBeUndefined()
    })
  })

  describe('calculateModuleDuration', () => {
    it('returns duration for module', () => {
      const duration = calculateModuleDuration('ATPL')
      expect(duration).toBeGreaterThan(0)
    })

    it('returns 0 for unknown module', () => {
      expect(calculateModuleDuration('UNKNOWN')).toBe(0)
    })
  })
})
