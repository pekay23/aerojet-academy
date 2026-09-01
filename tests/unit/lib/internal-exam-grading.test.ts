import { describe, it, expect } from 'vitest'
import { validateInternalExamResult, calculateInternalExamGrade, getInternalExamStatus, INTERNAL_EXAM_TYPES, INTERNAL_GRADE_THRESHOLDS } from '@/lib/internal-exam/grading'

describe('lib/internal-exam/grading', () => {
  describe('INTERNAL_EXAM_TYPES', () => {
    it('has expected types', () => {
      expect(INTERNAL_EXAM_TYPES.MIDTERM).toBeDefined()
      expect(INTERNAL_EXAM_TYPES.FINAL).toBeDefined()
      expect(INTERNAL_EXAM_TYPES.QUIZ).toBeDefined()
      expect(INTERNAL_EXAM_TYPES.ASSIGNMENT).toBeDefined()
    })
  })

  describe('INTERNAL_GRADE_THRESHOLDS', () => {
    it('has pass threshold', () => {
      expect(INTERNAL_GRADE_THRESHOLDS.PASS).toBeGreaterThan(0)
      expect(INTERNAL_GRADE_THRESHOLDS.PASS).toBeLessThanOrEqual(100)
    })

    it('has distinction threshold', () => {
      expect(INTERNAL_GRADE_THRESHOLDS.DISTINCTION).toBeGreaterThan(INTERNAL_GRADE_THRESHOLDS.PASS)
    })
  })

  describe('validateInternalExamResult', () => {
    it('returns valid for correct result', () => {
      const result = validateInternalExamResult({ score: 85, maxScore: 100 })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for score above max', () => {
      const result = validateInternalExamResult({ score: 150, maxScore: 100 })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for negative score', () => {
      const result = validateInternalExamResult({ score: -10, maxScore: 100 })
      expect(result.valid).toBe(false)
    })
  })

  describe('calculateInternalExamGrade', () => {
    it('returns A for score >= 90', () => {
      expect(calculateInternalExamGrade(95)).toBe('A')
    })

    it('returns B for score >= 80', () => {
      expect(calculateInternalExamGrade(85)).toBe('B')
    })

    it('returns F for score < 60', () => {
      expect(calculateInternalExamGrade(50)).toBe('F')
    })
  })

  describe('getInternalExamStatus', () => {
    it('returns PASSED for passing score', () => {
      expect(getInternalExamStatus(75)).toBe('PASSED')
    })

    it('returns FAILED for failing score', () => {
      expect(getInternalExamStatus(50)).toBe('FAILED')
    })
  })
})
