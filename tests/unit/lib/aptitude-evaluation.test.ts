import { describe, it, expect } from 'vitest'
import { getAptitudeTestType, calculateAptitudeScore, isAptitudePassed, getAptitudeFeedback, APTITUDE_TEST_TYPES, APTITUDE_PASS_THRESHOLD } from '@/lib/aptitude/evaluation'

describe('lib/aptitude/evaluation', () => {
  describe('APTITUDE_TEST_TYPES', () => {
    it('has expected types', () => {
      expect(APTITUDE_TEST_TYPES.NUMERICAL).toBeDefined()
      expect(APTITUDE_TEST_TYPES.VERBAL).toBeDefined()
      expect(APTITUDE_TEST_TYPES.LOGICAL).toBeDefined()
      expect(APTITUDE_TEST_TYPES.SPATIAL).toBeDefined()
    })
  })

  describe('APTITUDE_PASS_THRESHOLD', () => {
    it('is a number between 0 and 100', () => {
      expect(APTITUDE_PASS_THRESHOLD).toBeGreaterThanOrEqual(0)
      expect(APTITUDE_PASS_THRESHOLD).toBeLessThanOrEqual(100)
    })
  })

  describe('getAptitudeTestType', () => {
    it('returns type by code', () => {
      expect(getAptitudeTestType('NUMERICAL')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getAptitudeTestType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('calculateAptitudeScore', () => {
    it('returns percentage score', () => {
      expect(calculateAptitudeScore(8, 10)).toBe(80)
    })

    it('returns 0 for zero correct', () => {
      expect(calculateAptitudeScore(0, 10)).toBe(0)
    })

    it('returns 100 for all correct', () => {
      expect(calculateAptitudeScore(10, 10)).toBe(100)
    })
  })

  describe('isAptitudePassed', () => {
    it('returns true for score above threshold', () => {
      expect(isAptitudePassed(80)).toBe(true)
    })

    it('returns false for score below threshold', () => {
      expect(isAptitudePassed(50)).toBe(false)
    })
  })

  describe('getAptitudeFeedback', () => {
    it('returns EXCELLENT for high score', () => {
      expect(getAptitudeFeedback(95)).toBe('EXCELLENT')
    })

    it('returns GOOD for medium score', () => {
      expect(getAptitudeFeedback(75)).toBe('GOOD')
    })

    it('returns NEEDS_IMPROVEMENT for low score', () => {
      expect(getAptitudeFeedback(40)).toBe('NEEDS_IMPROVEMENT')
    })
  })
})
