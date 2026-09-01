import { describe, it, expect } from 'vitest'
import { getClassroomById, getClassroomCapacity, isClassroomAvailable, CLASSROOM_TYPES, CLASSROOM_CAPACITIES } from '@/lib/scheduling/classrooms'

describe('lib/scheduling/classrooms', () => {
  describe('CLASSROOM_TYPES', () => {
    it('has expected types', () => {
      expect(CLASSROOM_TYPES.LECTURE_HALL).toBeDefined()
      expect(CLASSROOM_TYPES.CLASSROOM).toBeDefined()
      expect(CLASSROOM_TYPES.LAB).toBeDefined()
    })
  })

  describe('CLASSROOM_CAPACITIES', () => {
    it('has capacity for each type', () => {
      for (const [type, capacity] of Object.entries(CLASSROOM_CAPACITIES)) {
        expect(capacity).toBeGreaterThan(0)
      }
    })
  })

  describe('getClassroomById', () => {
    it('returns classroom by id', () => {
      const classroom = getClassroomById('classroom-1')
      expect(classroom).toBeDefined()
      expect(classroom?.id).toBe('classroom-1')
    })

    it('returns undefined for unknown id', () => {
      expect(getClassroomById('unknown')).toBeUndefined()
    })
  })

  describe('getClassroomCapacity', () => {
    it('returns capacity for valid type', () => {
      expect(getClassroomCapacity('LECTURE_HALL')).toBeGreaterThan(0)
    })

    it('returns 0 for unknown type', () => {
      expect(getClassroomCapacity('UNKNOWN')).toBe(0)
    })
  })

  describe('isClassroomAvailable', () => {
    it('returns true when no conflicts', () => {
      expect(isClassroomAvailable('classroom-1', new Date('2026-01-01T09:00:00'), new Date('2026-01-01T11:00:00'), [])).toBe(true)
    })

    it('returns false when there is a conflict', () => {
      const conflicts = [{ start: new Date('2026-01-01T10:00:00'), end: new Date('2026-01-01T12:00:00') }]
      expect(isClassroomAvailable('classroom-1', new Date('2026-01-01T09:00:00'), new Date('2026-01-01T11:00:00'), conflicts)).toBe(false)
    })

    it('returns true for non-overlapping time', () => {
      const conflicts = [{ start: new Date('2026-01-01T12:00:00'), end: new Date('2026-01-01T14:00:00') }]
      expect(isClassroomAvailable('classroom-1', new Date('2026-01-01T09:00:00'), new Date('2026-01-01T11:00:00'), conflicts)).toBe(true)
    })
  })
})
