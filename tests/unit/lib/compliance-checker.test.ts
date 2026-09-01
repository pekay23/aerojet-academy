import { describe, it, expect } from 'vitest'
import { getComplianceStatus, isCompliant, getComplianceScore, COMPLIANCE_THRESHOLD } from '@/lib/compliance/checker'

describe('lib/compliance/checker', () => {
  describe('COMPLIANCE_THRESHOLD', () => {
    it('is a number between 0 and 100', () => {
      expect(COMPLIANCE_THRESHOLD).toBeGreaterThanOrEqual(0)
      expect(COMPLIANCE_THRESHOLD).toBeLessThanOrEqual(100)
    })
  })

  describe('getComplianceStatus', () => {
    it('returns COMPLIANT for score above threshold', () => {
      expect(getComplianceStatus(90)).toBe('COMPLIANT')
    })

    it('returns NON_COMPLIANT for score below threshold', () => {
      expect(getComplianceStatus(50)).toBe('NON_COMPLIANT')
    })

    it('returns COMPLIANT for exact threshold', () => {
      expect(getComplianceStatus(COMPLIANCE_THRESHOLD)).toBe('COMPLIANT')
    })
  })

  describe('isCompliant', () => {
    it('returns true when compliant', () => {
      expect(isCompliant(90)).toBe(true)
    })

    it('returns false when not compliant', () => {
      expect(isCompliant(50)).toBe(false)
    })
  })

  describe('getComplianceScore', () => {
    it('returns number between 0 and 100', () => {
      const score = getComplianceScore({ documents: true, training: true, certifications: false })
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('returns 100 for full compliance', () => {
      const score = getComplianceScore({ documents: true, training: true, certifications: true })
      expect(score).toBe(100)
    })

    it('returns 0 for no compliance', () => {
      const score = getComplianceScore({ documents: false, training: false, certifications: false })
      expect(score).toBe(0)
    })
  })
})
