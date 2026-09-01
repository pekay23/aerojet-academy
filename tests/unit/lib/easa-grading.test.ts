import { describe, it, expect } from 'vitest'
import { calculateEasaModuleGrade, isEasaPassMark, getEasaGrade, EASA_GRADE_THRESHOLDS, EASA_PASS_MARK } from '@/lib/easa/grading'

describe('lib/easa/grading', () => {
  describe('EASA_PASS_MARK', () => {
    it('is a number between 0 and 100', () => {
      expect(EASA_PASS_MARK).toBeGreaterThanOrEqual(0)
      expect(EASA_PASS_MARK).toBeLessThanOrEqual(100)
    })
  })

  describe('EASA_GRADE_THRESHOLDS', () => {
    it('has all grade thresholds', () => {
      expect(EASA_GRADE_THRESHOLDS.A).toBeDefined()
      expect(EASA_GRADE_THRESHOLDS.B).toBeDefined()
      expect(EASA_GRADE_THRESHOLDS.C).toBeDefined()
      expect(EASA_GRADE_THRESHOLDS.D).toBeDefined()
      expect(EASA_GRADE_THRESHOLDS.F).toBeDefined()
    })

    it('thresholds are in descending order', () => {
      expect(EASA_GRADE_THRESHOLDS.A).toBeGreaterThan(EASA_GRADE_THRESHOLDS.B)
      expect(EASA_GRADE_THRESHOLDS.B).toBeGreaterThan(EASA_GRADE_THRESHOLDS.C)
      expect(EASA_GRADE_THRESHOLDS.C).toBeGreaterThan(EASA_GRADE_THRESHOLDS.D)
      expect(EASA_GRADE_THRESHOLDS.D).toBeGreaterThan(EASA_GRADE_THRESHOLDS.F)
    })
  })

  describe('calculateEasaModuleGrade', () => {
    it('returns A for score >= 90', () => {
      expect(calculateEasaModuleGrade(95)).toBe('A')
    })

    it('returns B for score >= 80', () => {
      expect(calculateEasaModuleGrade(85)).toBe('B')
    })

    it('returns C for score >= 70', () => {
      expect(calculateEasaModuleGrade(75)).toBe('C')
    })

    it('returns D for score >= 60', () => {
      expect(calculateEasaModuleGrade(65)).toBe('D')
    })

    it('returns F for score < 60', () => {
      expect(calculateEasaModuleGrade(50)).toBe('F')
    })
  })

  describe('isEasaPassMark', () => {
    it('returns true for passing score', () => {
      expect(isEasaPassMark(75)).toBe(true)
    })

    it('returns false for failing score', () => {
      expect(isEasaPassMark(50)).toBe(false)
    })

    it('returns true for exact pass mark', () => {
      expect(isEasaPassMark(EASA_PASS_MARK)).toBe(true)
    })
  })

  describe('getEasaGrade', () => {
    it('returns grade for score', () => {
      expect(getEasaGrade(95)).toBe('A')
      expect(getEasaGrade(75)).toBe('C')
      expect(getEasaGrade(50)).toBe('F')
    })

    it('returns F for null score', () => {
      expect(getEasaGrade(null)).toBe('F')
    })
  })
})
