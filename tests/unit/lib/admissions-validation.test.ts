import { describe, it, expect } from 'vitest'
import { validateCourseApplication, getApplicationStatus, isApplicationComplete, APPLICATION_STATUS, APPLICATION_TYPES } from '@/lib/admissions/validation'

describe('lib/admissions/validation', () => {
  describe('APPLICATION_STATUS', () => {
    it('has expected status values', () => {
      expect(APPLICATION_STATUS.DRAFT).toBe('DRAFT')
      expect(APPLICATION_STATUS.SUBMITTED).toBe('SUBMITTED')
      expect(APPLICATION_STATUS.UNDER_REVIEW).toBe('UNDER_REVIEW')
      expect(APPLICATION_STATUS.ACCEPTED).toBe('ACCEPTED')
      expect(APPLICATION_STATUS.REJECTED).toBe('REJECTED')
    })
  })

  describe('APPLICATION_TYPES', () => {
    it('has expected type values', () => {
      expect(APPLICATION_TYPES.NEW).toBe('NEW')
      expect(APPLICATION_TYPES.TRANSFER).toBe('TRANSFER')
      expect(APPLICATION_TYPES.RE_ADMISSION).toBe('RE_ADMISSION')
    })
  })

  describe('validateCourseApplication', () => {
    it('returns valid for complete application', () => {
      const result = validateCourseApplication({
        applicantName: 'John Doe',
        email: 'john@example.com',
        courseId: 'course-1',
        type: 'NEW',
      })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for missing name', () => {
      const result = validateCourseApplication({
        email: 'john@example.com',
        courseId: 'course-1',
        type: 'NEW',
      })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for missing email', () => {
      const result = validateCourseApplication({
        applicantName: 'John Doe',
        courseId: 'course-1',
        type: 'NEW',
      })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for invalid email', () => {
      const result = validateCourseApplication({
        applicantName: 'John Doe',
        email: 'invalid-email',
        courseId: 'course-1',
        type: 'NEW',
      })
      expect(result.valid).toBe(false)
    })
  })

  describe('getApplicationStatus', () => {
    it('returns correct status', () => {
      expect(getApplicationStatus({ status: 'SUBMITTED' })).toBe('SUBMITTED')
    })

    it('returns UNDER_REVIEW for review step', () => {
      expect(getApplicationStatus({ status: 'UNDER_REVIEW' })).toBe('UNDER_REVIEW')
    })
  })

  describe('isApplicationComplete', () => {
    it('returns true when all required fields present', () => {
      expect(isApplicationComplete({ applicantName: 'John', email: 'john@example.com', courseId: '1' })).toBe(true)
    })

    it('returns false when fields missing', () => {
      expect(isApplicationComplete({ applicantName: 'John' })).toBe(false)
    })
  })
})
