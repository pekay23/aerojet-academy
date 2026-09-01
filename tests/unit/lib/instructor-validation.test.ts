import { describe, it, expect } from 'vitest'
import { validateInstructor, getInstructorStatus, isInstructorActive, INSTRUCTOR_STATUS, INSTRUCTOR_TYPES } from '@/lib/instructor/validation'

describe('lib/instructor/validation', () => {
  describe('INSTRUCTOR_STATUS', () => {
    it('has expected status values', () => {
      expect(INSTRUCTOR_STATUS.ACTIVE).toBe('ACTIVE')
      expect(INSTRUCTOR_STATUS.ON_LEAVE).toBe('ON_LEAVE')
      expect(INSTRUCTOR_STATUS.TERMINATED).toBe('TERMINATED')
    })
  })

  describe('INSTRUCTOR_TYPES', () => {
    it('has expected type values', () => {
      expect(INSTRUCTOR_TYPES.FULL_TIME).toBe('FULL_TIME')
      expect(INSTRUCTOR_TYPES.PART_TIME).toBe('PART_TIME')
      expect(INSTRUCTOR_TYPES.CONTRACT).toBe('CONTRACT')
    })
  })

  describe('validateInstructor', () => {
    it('returns valid for complete instructor', () => {
      const result = validateInstructor({ name: 'John Doe', email: 'john@example.com', licenseNumber: 'ATPL-12345' })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for missing name', () => {
      const result = validateInstructor({ email: 'john@example.com', licenseNumber: 'ATPL-12345' })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for missing email', () => {
      const result = validateInstructor({ name: 'John Doe', licenseNumber: 'ATPL-12345' })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for invalid email', () => {
      const result = validateInstructor({ name: 'John Doe', email: 'invalid', licenseNumber: 'ATPL-12345' })
      expect(result.valid).toBe(false)
    })
  })

  describe('getInstructorStatus', () => {
    it('returns ACTIVE for active instructor', () => {
      expect(getInstructorStatus({ status: 'ACTIVE' })).toBe('ACTIVE')
    })

    it('returns ON_LEAVE for instructor on leave', () => {
      expect(getInstructorStatus({ status: 'ON_LEAVE' })).toBe('ON_LEAVE')
    })
  })

  describe('isInstructorActive', () => {
    it('returns true for ACTIVE status', () => {
      expect(isInstructorActive('ACTIVE')).toBe(true)
    })

    it('returns false for ON_LEAVE status', () => {
      expect(isInstructorActive('ON_LEAVE')).toBe(false)
    })

    it('returns false for TERMINATED status', () => {
      expect(isInstructorActive('TERMINATED')).toBe(false)
    })
  })
})
