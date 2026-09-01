import { describe, it, expect } from 'vitest'
import { EASA_PASSING_GRADE, calculateLetterGrade, isPassing, evaluateCombinedExamResult } from '@/lib/utils/grading'

describe('lib/utils/grading', () => {
  describe('EASA_PASSING_GRADE', () => {
    it('is 75', () => {
      expect(EASA_PASSING_GRADE).toBe(75)
    })
  })

  describe('calculateLetterGrade', () => {
    it('returns P for passing grades', () => {
      expect(calculateLetterGrade(75)).toBe('P')
      expect(calculateLetterGrade(80)).toBe('P')
      expect(calculateLetterGrade(100)).toBe('P')
    })

    it('returns F for failing grades', () => {
      expect(calculateLetterGrade(74)).toBe('F')
      expect(calculateLetterGrade(0)).toBe('F')
      expect(calculateLetterGrade(50)).toBe('F')
    })

    it('handles boundary exactly at 75', () => {
      expect(calculateLetterGrade(75)).toBe('P')
    })
  })

  describe('isPassing', () => {
    it('returns true for passing grades', () => {
      expect(isPassing(75)).toBe(true)
      expect(isPassing(100)).toBe(true)
    })

    it('returns false for failing grades', () => {
      expect(isPassing(74)).toBe(false)
      expect(isPassing(0)).toBe(false)
    })
  })

  describe('evaluateCombinedExamResult', () => {
    it('returns passed when both components pass', () => {
      const result = evaluateCombinedExamResult(80, 85)
      expect(result.passed).toBe(true)
      expect(result.mcqPassed).toBe(true)
      expect(result.essayPassed).toBe(true)
      expect(result.requiresResit).toBe(false)
    })

    it('returns failed when MCQ fails', () => {
      const result = evaluateCombinedExamResult(70, 85)
      expect(result.passed).toBe(false)
      expect(result.mcqPassed).toBe(false)
      expect(result.essayPassed).toBe(true)
      expect(result.requiresResit).toBe(true)
    })

    it('returns failed when essay fails', () => {
      const result = evaluateCombinedExamResult(85, 70)
      expect(result.passed).toBe(false)
      expect(result.mcqPassed).toBe(true)
      expect(result.essayPassed).toBe(false)
      expect(result.requiresResit).toBe(true)
    })

    it('returns failed when both fail', () => {
      const result = evaluateCombinedExamResult(70, 70)
      expect(result.passed).toBe(false)
      expect(result.requiresResit).toBe(true)
    })

    it('handles boundary at 75', () => {
      const result = evaluateCombinedExamResult(75, 75)
      expect(result.passed).toBe(true)
    })
  })
})
