import { describe, it, expect } from 'vitest'
import { validateCourse, getCourseStatus, isCourseActive, COURSE_STATUS, COURSE_TYPES } from '@/lib/courses/validation'

describe('lib/courses/validation', () => {
  describe('COURSE_STATUS', () => {
    it('has expected status values', () => {
      expect(COURSE_STATUS.ACTIVE).toBe('ACTIVE')
      expect(COURSE_STATUS.DRAFT).toBe('DRAFT')
      expect(COURSE_STATUS.ARCHIVED).toBe('ARCHIVED')
    })
  })

  describe('COURSE_TYPES', () => {
    it('has expected types', () => {
      expect(COURSE_TYPES.FULL_TIME).toBeDefined()
      expect(COURSE_TYPES.MODULAR).toBeDefined()
      expect(COURSE_TYPES.EXAM_ONLY).toBeDefined()
    })
  })

  describe('validateCourse', () => {
    it('returns valid for valid course', () => {
      const result = validateCourse({ name: 'PPL', code: 'PPL-001', type: 'FULL_TIME' })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for missing name', () => {
      const result = validateCourse({ code: 'PPL-001', type: 'FULL_TIME' })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for missing code', () => {
      const result = validateCourse({ name: 'PPL', type: 'FULL_TIME' })
      expect(result.valid).toBe(false)
    })
  })

  describe('getCourseStatus', () => {
    it('returns ACTIVE for active course', () => {
      expect(getCourseStatus({ status: 'ACTIVE' })).toBe('ACTIVE')
    })

    it('returns DRAFT for draft course', () => {
      expect(getCourseStatus({ status: 'DRAFT' })).toBe('DRAFT')
    })
  })

  describe('isCourseActive', () => {
    it('returns true for ACTIVE course', () => {
      expect(isCourseActive('ACTIVE')).toBe(true)
    })

    it('returns false for ARCHIVED course', () => {
      expect(isCourseActive('ARCHIVED')).toBe(false)
    })
  })
})
