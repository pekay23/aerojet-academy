import { describe, it, expect } from 'vitest'
import { getEnrollmentStatus, calculateEnrollmentProgress, isEnrollmentActive, ENROLLMENT_STATUS, ENROLLMENT_TYPES } from '@/lib/enrollment/status'

describe('lib/enrollment/status', () => {
  describe('ENROLLMENT_STATUS', () => {
    it('has expected status values', () => {
      expect(ENROLLMENT_STATUS.ACTIVE).toBe('ACTIVE')
      expect(ENROLLMENT_STATUS.PENDING).toBe('PENDING')
      expect(ENROLLMENT_STATUS.COMPLETED).toBe('COMPLETED')
      expect(ENROLLMENT_STATUS.CANCELLED).toBe('CANCELLED')
    })
  })

  describe('ENROLLMENT_TYPES', () => {
    it('has expected type values', () => {
      expect(ENROLLMENT_TYPES.FULL_TIME).toBe('FULL_TIME')
      expect(ENROLLMENT_TYPES.MODULAR).toBe('MODULAR')
      expect(ENROLLMENT_TYPES.EXAM_ONLY).toBe('EXAM_ONLY')
    })
  })

  describe('getEnrollmentStatus', () => {
    it('returns ACTIVE for active enrollment', () => {
      expect(getEnrollmentStatus({ status: 'ACTIVE' })).toBe('ACTIVE')
    })

    it('returns COMPLETED for completed enrollment', () => {
      expect(getEnrollmentStatus({ status: 'COMPLETED' })).toBe('COMPLETED')
    })
  })

  describe('calculateEnrollmentProgress', () => {
    it('returns 0 for no completed modules', () => {
      expect(calculateEnrollmentProgress(0, 10)).toBe(0)
    })

    it('returns 100 for all completed modules', () => {
      expect(calculateEnrollmentProgress(10, 10)).toBe(100)
    })

    it('returns correct percentage', () => {
      expect(calculateEnrollmentProgress(5, 10)).toBe(50)
    })
  })

  describe('isEnrollmentActive', () => {
    it('returns true for ACTIVE status', () => {
      expect(isEnrollmentActive('ACTIVE')).toBe(true)
    })

    it('returns false for COMPLETED status', () => {
      expect(isEnrollmentActive('COMPLETED')).toBe(false)
    })

    it('returns false for CANCELLED status', () => {
      expect(isEnrollmentActive('CANCELLED')).toBe(false)
    })
  })
})
