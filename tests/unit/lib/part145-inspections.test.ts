import { describe, it, expect } from 'vitest'
import { calculatePart145InspectionScore, getInspectionResult, isInspectionPassed, INSPECTION_CRITERIA, INSPECTION_PASS_THRESHOLD } from '@/lib/part145/inspections'

describe('lib/part145/inspections', () => {
  describe('INSPECTION_PASS_THRESHOLD', () => {
    it('is a number between 0 and 100', () => {
      expect(INSPECTION_PASS_THRESHOLD).toBeGreaterThanOrEqual(0)
      expect(INSPECTION_PASS_THRESHOLD).toBeLessThanOrEqual(100)
    })
  })

  describe('INSPECTION_CRITERIA', () => {
    it('has expected criteria', () => {
      expect(INSPECTION_CRITERIA.SAFETY).toBeDefined()
      expect(INSPECTION_CRITERIA.MAINTENANCE).toBeDefined()
      expect(INSPECTION_CRITERIA.DOCUMENTATION).toBeDefined()
    })

    it('each criterion has weight', () => {
      for (const [key, criterion] of Object.entries(INSPECTION_CRITERIA)) {
        expect(criterion.weight).toBeGreaterThan(0)
      }
    })
  })

  describe('calculatePart145InspectionScore', () => {
    it('returns weighted score', () => {
      const results = { SAFETY: 100, MAINTENANCE: 80, DOCUMENTATION: 90 }
      const score = calculatePart145InspectionScore(results)
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('returns 0 for no criteria', () => {
      expect(calculatePart145InspectionScore({})).toBe(0)
    })
  })

  describe('getInspectionResult', () => {
    it('returns PASS for score above threshold', () => {
      expect(getInspectionResult(90)).toBe('PASS')
    })

    it('returns FAIL for score below threshold', () => {
      expect(getInspectionResult(50)).toBe('FAIL')
    })
  })

  describe('isInspectionPassed', () => {
    it('returns true for passing score', () => {
      expect(isInspectionPassed(90)).toBe(true)
    })

    it('returns false for failing score', () => {
      expect(isInspectionPassed(50)).toBe(false)
    })
  })
})
