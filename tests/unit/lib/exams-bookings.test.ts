import { describe, it, expect } from 'vitest'
import { validateBooking, getBookingStatus, calculateBookingPrice, BOOKING_STATUS, BOOKING_TYPES } from '@/lib/exams/bookings'

describe('lib/exams/bookings', () => {
  describe('BOOKING_STATUS', () => {
    it('has expected status values', () => {
      expect(BOOKING_STATUS.CONFIRMED).toBe('CONFIRMED')
      expect(BOOKING_STATUS.PENDING).toBe('PENDING')
      expect(BOOKING_STATUS.CANCELLED).toBe('CANCELLED')
      expect(BOOKING_STATUS.COMPLETED).toBe('COMPLETED')
    })
  })

  describe('BOOKING_TYPES', () => {
    it('has expected type values', () => {
      expect(BOOKING_TYPES.POOL).toBe('POOL')
      expect(BOOKING_TYPES.INDIVIDUAL).toBe('INDIVIDUAL')
      expect(BOOKING_TYPES.RESIT).toBe('RESIT')
    })
  })

  describe('validateBooking', () => {
    it('returns valid for valid booking', () => {
      const result = validateBooking({ studentId: 'student-1', examId: 'exam-1', type: 'INDIVIDUAL' })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for missing student', () => {
      const result = validateBooking({ examId: 'exam-1', type: 'INDIVIDUAL' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('studentId is required')
    })

    it('returns invalid for missing exam', () => {
      const result = validateBooking({ studentId: 'student-1', type: 'INDIVIDUAL' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('examId is required')
    })
  })

  describe('getBookingStatus', () => {
    it('returns CONFIRMED for paid booking', () => {
      expect(getBookingStatus({ status: 'PENDING', paid: true })).toBe('CONFIRMED')
    })

    it('returns PENDING for unpaid booking', () => {
      expect(getBookingStatus({ status: 'PENDING', paid: false })).toBe('PENDING')
    })
  })

  describe('calculateBookingPrice', () => {
    it('returns pool price for pool booking', () => {
      expect(calculateBookingPrice({ type: 'POOL' })).toBe(300)
    })

    it('returns individual price for individual booking', () => {
      expect(calculateBookingPrice({ type: 'INDIVIDUAL' })).toBe(520)
    })

    it('returns resit price for resit booking', () => {
      expect(calculateBookingPrice({ type: 'RESIT' })).toBe(300)
    })
  })
})
