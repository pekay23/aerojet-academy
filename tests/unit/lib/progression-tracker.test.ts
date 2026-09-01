import { describe, it, expect } from 'vitest'
import { getProgressPercentage, isCourseCompleted, calculateRemainingModules, getNextModule, MODULE_PROGRESS_THRESHOLD } from '@/lib/progression/tracker'

describe('lib/progression/tracker', () => {
  describe('MODULE_PROGRESS_THRESHOLD', () => {
    it('is a number', () => {
      expect(typeof MODULE_PROGRESS_THRESHOLD).toBe('number')
    })

    it('is between 0 and 100', () => {
      expect(MODULE_PROGRESS_THRESHOLD).toBeGreaterThanOrEqual(0)
      expect(MODULE_PROGRESS_THRESHOLD).toBeLessThanOrEqual(100)
    })
  })

  describe('getProgressPercentage', () => {
    it('returns 0 for no completed modules', () => {
      expect(getProgressPercentage(0, 10)).toBe(0)
    })

    it('returns 100 for all completed modules', () => {
      expect(getProgressPercentage(10, 10)).toBe(100)
    })

    it('returns correct percentage', () => {
      expect(getProgressPercentage(5, 10)).toBe(50)
    })

    it('handles single module', () => {
      expect(getProgressPercentage(1, 1)).toBe(100)
    })
  })

  describe('isCourseCompleted', () => {
    it('returns true when all modules completed', () => {
      expect(isCourseCompleted(5, 5)).toBe(true)
    })

    it('returns false when not all modules completed', () => {
      expect(isCourseCompleted(3, 5)).toBe(false)
    })

    it('returns true when completed exceeds total', () => {
      expect(isCourseCompleted(10, 5)).toBe(true)
    })
  })

  describe('calculateRemainingModules', () => {
    it('returns total when none completed', () => {
      expect(calculateRemainingModules(0, 10)).toBe(10)
    })

    it('returns 0 when all completed', () => {
      expect(calculateRemainingModules(10, 10)).toBe(0)
    })

    it('returns correct remaining count', () => {
      expect(calculateRemainingModules(3, 10)).toBe(7)
    })
  })

  describe('getNextModule', () => {
    it('returns first module when none completed', () => {
      expect(getNextModule(0, ['M1', 'M2', 'M3'])).toBe('M1')
    })

    it('returns next uncompleted module', () => {
      expect(getNextModule(1, ['M1', 'M2', 'M3'])).toBe('M2')
    })

    it('returns null when all completed', () => {
      expect(getNextModule(3, ['M1', 'M2', 'M3'])).toBeNull()
    })
  })
})
