import { describe, it, expect } from 'vitest'
import { getSemester, getAcademicYear, isCurrentSemester, getSemesterDates, SEMESTERS, ACADEMIC_YEAR_START_MONTH } from '@/lib/calendar/semesters'

describe('lib/calendar/semesters', () => {
  describe('SEMESTERS', () => {
    it('has expected semesters', () => {
      expect(SEMESTERS.FALL).toBeDefined()
      expect(SEMESTERS.SPRING).toBeDefined()
      expect(SEMESTERS.SUMMER).toBeDefined()
    })

    it('each semester has start and end months', () => {
      for (const [key, semester] of Object.entries(SEMESTERS)) {
        expect(semester.startMonth).toBeDefined()
        expect(semester.endMonth).toBeDefined()
      }
    })
  })

  describe('ACADEMIC_YEAR_START_MONTH', () => {
    it('is a number between 1 and 12', () => {
      expect(ACADEMIC_YEAR_START_MONTH).toBeGreaterThanOrEqual(1)
      expect(ACADEMIC_YEAR_START_MONTH).toBeLessThanOrEqual(12)
    })
  })

  describe('getSemester', () => {
    it('returns semester by code', () => {
      expect(getSemester('FALL')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getSemester('UNKNOWN')).toBeUndefined()
    })
  })

  describe('getAcademicYear', () => {
    it('returns academic year string', () => {
      const year = getAcademicYear(new Date('2026-09-01'))
      expect(typeof year).toBe('string')
      expect(year).toContain('2026')
    })

    it('returns correct year for date in academic year', () => {
      const year = getAcademicYear(new Date('2026-01-01'))
      expect(year).toContain('2025')
    })
  })

  describe('isCurrentSemester', () => {
    it('returns true for current semester', () => {
      const now = new Date()
      expect(isCurrentSemester('FALL', now)).toBe(true)
    })

    it('returns false for other semester', () => {
      expect(isCurrentSemester('SUMMER', new Date('2026-01-01'))).toBe(false)
    })
  })

  describe('getSemesterDates', () => {
    it('returns start and end dates', () => {
      const dates = getSemesterDates('FALL', 2026)
      expect(dates.start).toBeInstanceOf(Date)
      expect(dates.end).toBeInstanceOf(Date)
    })

    it('start is before end', () => {
      const dates = getSemesterDates('FALL', 2026)
      expect(dates.start.getTime()).toBeLessThan(dates.end.getTime())
    })
  })
})
