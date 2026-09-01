import { describe, it, expect } from 'vitest'
import { getEnrollmentType, canEnrollInCourse, getEnrollmentDeadline, ENROLLMENT_TYPES, ENROLLMENT_DEADLINES } from '@/lib/enrollment/validation'

describe('lib/enrollment/validation', () => {
  describe('ENROLLMENT_TYPES', () => {
    it('has expected types', () => {
      expect(ENROLLMENT_TYPES.FULL_TIME).toBeDefined()
      expect(ENROLLMENT_TYPES.MODULAR).toBeDefined()
      expect(ENROLLMENT_TYPES.EXAM_ONLY).toBeDefined()
    })
  })

  describe('ENROLLMENT_DEADLINES', () => {
    it('has deadline for each type', () => {
      for (const [type, deadline] of Object.entries(ENROLLMENT_DEADLINES)) {
        expect(deadline).toBeGreaterThan(0)
      }
    })
  })

  describe('getEnrollmentType', () => {
    it('returns type by code', () => {
      expect(getEnrollmentType('FULL_TIME')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getEnrollmentType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('canEnrollInCourse', () => {
    it('returns true for available course', () => {
      expect(canEnrollInCourse('course-1', 'FULL_TIME')).toBe(true)
    })

    it('returns false for full course', () => {
      expect(canEnrollInCourse('course-full', 'FULL_TIME')).toBe(false)
    })

    it('returns false for past deadline', () => {
      expect(canEnrollInCourse('course-1', 'FULL_TIME', new Date(Date.now() - 86400000))).toBe(false)
    })
  })

  describe('getEnrollmentDeadline', () => {
    it('returns deadline for type', () => {
      const deadline = getEnrollmentDeadline('FULL_TIME')
      expect(deadline).toBeGreaterThan(0)
    })

    it('returns 0 for unknown type', () => {
      expect(getEnrollmentDeadline('UNKNOWN')).toBe(0)
    })
  })
})
