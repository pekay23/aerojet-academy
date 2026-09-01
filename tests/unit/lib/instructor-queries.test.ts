import { describe, it, expect } from 'vitest'
import { getInstructorById, getInstructorCourses, isInstructorAvailable, INSTRUCTOR_STATUS, INSTRUCTOR_RATINGS } from '@/lib/instructor/queries'

describe('lib/instructor/queries', () => {
  describe('INSTRUCTOR_STATUS', () => {
    it('has expected status values', () => {
      expect(INSTRUCTOR_STATUS.ACTIVE).toBe('ACTIVE')
      expect(INSTRUCTOR_STATUS.ON_LEAVE).toBe('ON_LEAVE')
      expect(INSTRUCTOR_STATUS.INACTIVE).toBe('INACTIVE')
    })
  })

  describe('INSTRUCTOR_RATINGS', () => {
    it('has min and max', () => {
      expect(INSTRUCTOR_RATINGS.MIN).toBeGreaterThanOrEqual(0)
      expect(INSTRUCTOR_RATINGS.MAX).toBeLessThanOrEqual(5)
      expect(INSTRUCTOR_RATINGS.MIN).toBeLessThan(INSTRUCTOR_RATINGS.MAX)
    })
  })

  describe('getInstructorById', () => {
    it('returns instructor by id', () => {
      const instructor = getInstructorById('instructor-1')
      expect(instructor).toBeDefined()
      expect(instructor?.id).toBe('instructor-1')
    })

    it('returns undefined for unknown id', () => {
      expect(getInstructorById('unknown')).toBeUndefined()
    })
  })

  describe('getInstructorCourses', () => {
    it('returns courses array', () => {
      const courses = getInstructorCourses('instructor-1')
      expect(Array.isArray(courses)).toBe(true)
    })

    it('returns empty array for unknown instructor', () => {
      expect(getInstructorCourses('unknown')).toEqual([])
    })
  })

  describe('isInstructorAvailable', () => {
    it('returns true for active instructor', () => {
      expect(isInstructorAvailable('instructor-1')).toBe(true)
    })

    it('returns false for inactive instructor', () => {
      expect(isInstructorAvailable('instructor-inactive')).toBe(false)
    })
  })
})
