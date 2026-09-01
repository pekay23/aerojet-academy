import { describe, it, expect } from 'vitest'
import { formatInternalExamDate, getInternalExamType, isInternalExamGraded, INTERNAL_EXAM_FORMATS, INTERNAL_EXAM_WEIGHTS } from '@/lib/internal-exam/formatters'

describe('lib/internal-exam/formatters', () => {
  describe('INTERNAL_EXAM_FORMATS', () => {
    it('has expected formats', () => {
      expect(INTERNAL_EXAM_FORMATS.MULTIPLE_CHOICE).toBeDefined()
      expect(INTERNAL_EXAM_FORMATS.ESSAY).toBeDefined()
      expect(INTERNAL_EXAM_FORMATS.PRACTICAL).toBeDefined()
    })

    it('each format has name', () => {
      for (const [key, format] of Object.entries(INTERNAL_EXAM_FORMATS)) {
        expect(format.name).toBeDefined()
        expect(typeof format.name).toBe('string')
      }
    })
  })

  describe('INTERNAL_EXAM_WEIGHTS', () => {
    it('has weight for each format', () => {
      for (const [format, weight] of Object.entries(INTERNAL_EXAM_WEIGHTS)) {
        expect(weight).toBeGreaterThan(0)
        expect(weight).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('formatInternalExamDate', () => {
    it('returns formatted date string', () => {
      const date = new Date('2026-01-15T09:00:00')
      const formatted = formatInternalExamDate(date)
      expect(typeof formatted).toBe('string')
      expect(formatted).toContain('2026')
    })

    it('includes time', () => {
      const date = new Date('2026-01-15T09:00:00')
      const formatted = formatInternalExamDate(date)
      expect(formatted).toContain('09:00')
    })
  })

  describe('getInternalExamType', () => {
    it('returns type by code', () => {
      expect(getInternalExamType('MULTIPLE_CHOICE')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getInternalExamType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('isInternalExamGraded', () => {
    it('returns true for graded exam', () => {
      expect(isInternalExamGraded({ graded: true })).toBe(true)
    })

    it('returns false for ungraded exam', () => {
      expect(isInternalExamGraded({ graded: false })).toBe(false)
    })
  })
})
