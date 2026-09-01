import { describe, it, expect } from 'vitest'
import { formatClassSchedule, getClassType, isClassFull, CLASS_TYPES, CLASS_STATUS } from '@/lib/scheduling/classes'

describe('lib/scheduling/classes', () => {
  describe('CLASS_TYPES', () => {
    it('has expected types', () => {
      expect(CLASS_TYPES.LECTURE).toBeDefined()
      expect(CLASS_TYPES.LAB).toBeDefined()
      expect(CLASS_TYPES.TUTORIAL).toBeDefined()
    })
  })

  describe('CLASS_STATUS', () => {
    it('has expected status values', () => {
      expect(CLASS_STATUS.SCHEDULED).toBe('SCHEDULED')
      expect(CLASS_STATUS.ONGOING).toBe('ONGOING')
      expect(CLASS_STATUS.COMPLETED).toBe('COMPLETED')
      expect(CLASS_STATUS.CANCELLED).toBe('CANCELLED')
    })
  })

  describe('formatClassSchedule', () => {
    it('returns formatted schedule string', () => {
      const schedule = formatClassSchedule({ day: 'Monday', startTime: '09:00', endTime: '11:00', room: 'Room 101' })
      expect(typeof schedule).toBe('string')
      expect(schedule).toContain('Monday')
      expect(schedule).toContain('09:00')
      expect(schedule).toContain('11:00')
    })

    it('includes room when provided', () => {
      const schedule = formatClassSchedule({ day: 'Monday', startTime: '09:00', endTime: '11:00', room: 'Room 101' })
      expect(schedule).toContain('Room 101')
    })
  })

  describe('getClassType', () => {
    it('returns type by code', () => {
      expect(getClassType('LECTURE')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getClassType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('isClassFull', () => {
    it('returns true when enrollment equals capacity', () => {
      expect(isClassFull({ capacity: 30, enrolled: 30 })).toBe(true)
    })

    it('returns false when enrollment below capacity', () => {
      expect(isClassFull({ capacity: 30, enrolled: 20 })).toBe(false)
    })

    it('returns true when enrollment exceeds capacity', () => {
      expect(isClassFull({ capacity: 30, enrolled: 35 })).toBe(true)
    })
  })
})
