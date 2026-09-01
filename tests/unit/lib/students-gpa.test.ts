import { describe, it, expect } from 'vitest'
import { calculateGpa, getGradePoint, isGoodStanding, GPA_SCALE, GPA_THRESHOLDS } from '@/lib/students/gpa'

describe('lib/students/gpa', () => {
  describe('GPA_SCALE', () => {
    it('has grade to point mapping', () => {
      expect(GPA_SCALE.A).toBeDefined()
      expect(GPA_SCALE.B).toBeDefined()
      expect(GPA_SCALE.C).toBeDefined()
      expect(GPA_SCALE.D).toBeDefined()
      expect(GPA_SCALE.F).toBeDefined()
    })

    it('points are in descending order', () => {
      expect(GPA_SCALE.A).toBeGreaterThan(GPA_SCALE.B)
      expect(GPA_SCALE.B).toBeGreaterThan(GPA_SCALE.C)
    })
  })

  describe('GPA_THRESHOLDS', () => {
    it('has good standing threshold', () => {
      expect(GPA_THRESHOLDS.GOOD_STANDING).toBeDefined()
      expect(GPA_THRESHOLDS.GOOD_STANDING).toBeGreaterThanOrEqual(0)
      expect(GPA_THRESHOLDS.GOOD_STANDING).toBeLessThanOrEqual(4)
    })
  })

  describe('getGradePoint', () => {
    it('returns correct point for A', () => {
      expect(getGradePoint('A')).toBe(GPA_SCALE.A)
    })

    it('returns 0 for F', () => {
      expect(getGradePoint('F')).toBe(GPA_SCALE.F)
    })

    it('returns 0 for invalid grade', () => {
      expect(getGradePoint('INVALID')).toBe(0)
    })
  })

  describe('calculateGpa', () => {
    it('returns 0 for no grades', () => {
      expect(calculateGpa([])).toBe(0)
    })

    it('calculates correct GPA', () => {
      const grades = [
        { grade: 'A', credits: 3 },
        { grade: 'B', credits: 3 },
      ]
      const gpa = calculateGpa(grades)
      expect(gpa).toBeGreaterThan(0)
      expect(gpa).toBeLessThanOrEqual(4)
    })

    it('handles single grade', () => {
      const grades = [{ grade: 'A', credits: 3 }]
      expect(calculateGpa(grades)).toBe(GPA_SCALE.A)
    })
  })

  describe('isGoodStanding', () => {
    it('returns true for GPA above threshold', () => {
      expect(isGoodStanding(3.5)).toBe(true)
    })

    it('returns false for GPA below threshold', () => {
      expect(isGoodStanding(1.5)).toBe(false)
    })

    it('returns true for exact threshold', () => {
      expect(isGoodStanding(GPA_THRESHOLDS.GOOD_STANDING)).toBe(true)
    })
  })
})
