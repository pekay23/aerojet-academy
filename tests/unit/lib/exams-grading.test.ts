import { describe, it, expect } from 'vitest'
import { calculateExamScore, determineGrade, isPassingGrade, GRADE_THRESHOLDS } from '@/lib/exams/grading'

describe('lib/exams/grading', () => {
  describe('calculateExamScore', () => {
    it('returns percentage', () => {
      expect(calculateExamScore(80, 100)).toBe(80)
    })

    it('returns 0 for zero marks', () => {
      expect(calculateExamScore(0, 100)).toBe(0)
    })

    it('returns 100 for full marks', () => {
      expect(calculateExamScore(100, 100)).toBe(100)
    })
  })

  describe('determineGrade', () => {
    it('returns A for score >= 90', () => {
      expect(determineGrade(95)).toBe('A')
    })

    it('returns B for score >= 80', () => {
      expect(determineGrade(85)).toBe('B')
    })

    it('returns C for score >= 70', () => {
      expect(determineGrade(75)).toBe('C')
    })

    it('returns D for score >= 60', () => {
      expect(determineGrade(65)).toBe('D')
    })

    it('returns F for score < 60', () => {
      expect(determineGrade(50)).toBe('F')
    })
  })

  describe('isPassingGrade', () => {
    it('returns true for passing grades', () => {
      expect(isPassingGrade('A')).toBe(true)
      expect(isPassingGrade('B')).toBe(true)
      expect(isPassingGrade('C')).toBe(true)
      expect(isPassingGrade('D')).toBe(true)
    })

    it('returns false for failing grade', () => {
      expect(isPassingGrade('F')).toBe(false)
    })

    it('returns false for null grade', () => {
      expect(isPassingGrade(null)).toBe(false)
    })
  })

  describe('GRADE_THRESHOLDS', () => {
    it('has A threshold at 90', () => {
      expect(GRADE_THRESHOLDS.A).toBe(90)
    })

    it('has B threshold at 80', () => {
      expect(GRADE_THRESHOLDS.B).toBe(80)
    })

    it('has C threshold at 70', () => {
      expect(GRADE_THRESHOLDS.C).toBe(70)
    })

    it('has D threshold at 60', () => {
      expect(GRADE_THRESHOLDS.D).toBe(60)
    })
  })
})
