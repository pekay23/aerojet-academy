import { describe, it, expect } from 'vitest'
import { calculateLetterGrade, isPassing, evaluateCombinedExamResult } from '@/lib/utils/grading'

describe('Grading', () => {
  describe('calculateLetterGrade', () => {
    it('returns P for passing score (>= 75)', () => {
      expect(calculateLetterGrade(75)).toBe('P')
      expect(calculateLetterGrade(80)).toBe('P')
      expect(calculateLetterGrade(100)).toBe('P')
    })

    it('returns F for failing score (< 75)', () => {
      expect(calculateLetterGrade(74)).toBe('F')
      expect(calculateLetterGrade(50)).toBe('F')
      expect(calculateLetterGrade(0)).toBe('F')
    })

    it('handles exact boundary at 75', () => {
      expect(calculateLetterGrade(75)).toBe('P')
      expect(calculateLetterGrade(74.999)).toBe('F')
    })

    it('handles decimal scores', () => {
      expect(calculateLetterGrade(74.5)).toBe('F')
      expect(calculateLetterGrade(75.0)).toBe('P')
      expect(calculateLetterGrade(99.9)).toBe('P')
    })

    it('handles null/undefined gracefully', () => {
      expect(calculateLetterGrade(NaN)).toBe('F')
      expect(calculateLetterGrade(Infinity)).toBe('P')
    })
  })

  describe('isPassing', () => {
    it('returns true for scores >= 75', () => {
      expect(isPassing(75)).toBe(true)
      expect(isPassing(100)).toBe(true)
    })

    it('returns false for scores < 75', () => {
      expect(isPassing(74)).toBe(false)
      expect(isPassing(0)).toBe(false)
    })

    it('returns true at exact boundary', () => {
      expect(isPassing(75)).toBe(true)
    })
  })

  describe('evaluateCombinedExamResult', () => {
    it('returns passed when both components pass', () => {
      const result = evaluateCombinedExamResult(80, 90)
      expect(result.passed).toBe(true)
      expect(result.mcqPassed).toBe(true)
      expect(result.essayPassed).toBe(true)
      expect(result.requiresResit).toBe(false)
    })

    it('returns requiresResit when MCQ fails', () => {
      const result = evaluateCombinedExamResult(70, 90)
      expect(result.passed).toBe(false)
      expect(result.mcqPassed).toBe(false)
      expect(result.essayPassed).toBe(true)
      expect(result.requiresResit).toBe(true)
    })

    it('returns requiresResit when essay fails', () => {
      const result = evaluateCombinedExamResult(90, 70)
      expect(result.passed).toBe(false)
      expect(result.mcqPassed).toBe(true)
      expect(result.essayPassed).toBe(false)
      expect(result.requiresResit).toBe(true)
    })

    it('returns requiresResit when both fail', () => {
      const result = evaluateCombinedExamResult(50, 60)
      expect(result.passed).toBe(false)
      expect(result.mcqPassed).toBe(false)
      expect(result.essayPassed).toBe(false)
      expect(result.requiresResit).toBe(true)
    })

    it('handles exact boundary scores', () => {
      const bothPass = evaluateCombinedExamResult(75, 75)
      expect(bothPass.passed).toBe(true)
      expect(bothPass.requiresResit).toBe(false)

      const mcqFail = evaluateCombinedExamResult(74, 75)
      expect(mcqFail.mcqPassed).toBe(false)
      expect(mcqFail.requiresResit).toBe(true)
    })

    it('handles zero scores', () => {
      const result = evaluateCombinedExamResult(0, 0)
      expect(result.passed).toBe(false)
      expect(result.requiresResit).toBe(true)
    })

    it('handles max scores', () => {
      const result = evaluateCombinedExamResult(100, 100)
      expect(result.passed).toBe(true)
      expect(result.requiresResit).toBe(false)
    })

    it('preserves original scores in output', () => {
      const result = evaluateCombinedExamResult(82.5, 91.3)
      expect(result.mcqPercentage).toBe(82.5)
      expect(result.essayPercentage).toBe(91.3)
    })
  })
})
