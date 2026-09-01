import { describe, it, expect } from 'vitest'
import { calculateAttendanceRate, markAttendance, getAttendanceStats, isAttendanceSufficient, ATTENDANCE_THRESHOLD } from '@/lib/attendance/tracker'

describe('lib/attendance/tracker', () => {
  describe('ATTENDANCE_THRESHOLD', () => {
    it('is a number between 0 and 100', () => {
      expect(ATTENDANCE_THRESHOLD).toBeGreaterThanOrEqual(0)
      expect(ATTENDANCE_THRESHOLD).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateAttendanceRate', () => {
    it('returns 0 for no classes', () => {
      expect(calculateAttendanceRate(0, 0)).toBe(0)
    })

    it('returns 100 for perfect attendance', () => {
      expect(calculateAttendanceRate(10, 10)).toBe(100)
    })

    it('returns correct percentage', () => {
      expect(calculateAttendanceRate(7, 10)).toBe(70)
    })

    it('returns 0 for no attended classes', () => {
      expect(calculateAttendanceRate(0, 10)).toBe(0)
    })
  })

  describe('markAttendance', () => {
    it('returns attendance record', () => {
      const record = markAttendance('class-123', 'student-456', true)
      expect(record.classId).toBe('class-123')
      expect(record.studentId).toBe('student-456')
      expect(record.present).toBe(true)
    })

    it('records absence correctly', () => {
      const record = markAttendance('class-123', 'student-456', false)
      expect(record.present).toBe(false)
    })

    it('includes timestamp', () => {
      const record = markAttendance('class-123', 'student-456', true)
      expect(record.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('getAttendanceStats', () => {
    it('returns stats object', () => {
      const stats = getAttendanceStats([true, true, false, true])
      expect(stats.total).toBe(4)
      expect(stats.present).toBe(3)
      expect(stats.absent).toBe(1)
    })

    it('returns 0 for empty array', () => {
      const stats = getAttendanceStats([])
      expect(stats.total).toBe(0)
      expect(stats.present).toBe(0)
    })
  })

  describe('isAttendanceSufficient', () => {
    it('returns true when attendance meets threshold', () => {
      expect(isAttendanceSufficient(90)).toBe(true)
    })

    it('returns false when attendance below threshold', () => {
      expect(isAttendanceSufficient(50)).toBe(false)
    })

    it('returns true when attendance equals threshold', () => {
      expect(isAttendanceSufficient(ATTENDANCE_THRESHOLD)).toBe(true)
    })
  })
})
