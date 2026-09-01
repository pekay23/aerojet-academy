import { describe, it, expect } from 'vitest'
import { getCourseCategory, getCategoryCourses, filterCoursesByCategory, COURSE_CATEGORIES, COURSE_LEVELS } from '@/lib/courses/categories'

describe('lib/courses/categories', () => {
  describe('COURSE_CATEGORIES', () => {
    it('has expected categories', () => {
      expect(COURSE_CATEGORIES.PRIVATE).toBeDefined()
      expect(COURSE_CATEGORIES.COMMERCIAL).toBeDefined()
      expect(COURSE_CATEGORIES.INSTRUMENT).toBeDefined()
    })

    it('each category has name', () => {
      for (const [key, cat] of Object.entries(COURSE_CATEGORIES)) {
        expect(cat.name).toBeDefined()
        expect(typeof cat.name).toBe('string')
      }
    })
  })

  describe('COURSE_LEVELS', () => {
    it('has expected levels', () => {
      expect(COURSE_LEVELS.BEGINNER).toBeDefined()
      expect(COURSE_LEVELS.INTERMEDIATE).toBeDefined()
      expect(COURSE_LEVELS.ADVANCED).toBeDefined()
    })
  })

  describe('getCourseCategory', () => {
    it('returns category by code', () => {
      expect(getCourseCategory('PRIVATE')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getCourseCategory('UNKNOWN')).toBeUndefined()
    })
  })

  describe('getCategoryCourses', () => {
    it('returns courses for category', () => {
      const courses = getCategoryCourses('PRIVATE')
      expect(Array.isArray(courses)).toBe(true)
    })

    it('returns empty array for unknown category', () => {
      expect(getCategoryCourses('UNKNOWN')).toEqual([])
    })
  })

  describe('filterCoursesByCategory', () => {
    it('filters courses by category', () => {
      const courses = [
        { id: '1', category: 'PRIVATE' },
        { id: '2', category: 'COMMERCIAL' },
      ]
      const filtered = filterCoursesByCategory(courses, 'PRIVATE')
      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe('1')
    })

    it('returns all courses for null category', () => {
      const courses = [
        { id: '1', category: 'PRIVATE' },
        { id: '2', category: 'COMMERCIAL' },
      ]
      expect(filterCoursesByCategory(courses, null)).toEqual(courses)
    })
  })
})
