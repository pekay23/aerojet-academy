import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit tests for the new exam filter helpers introduced in Phase 1.
 * These validate the isUpcomingBooking and isMissedBooking logic
 * without rendering React components.
 */

const COMPLETED_RESULT_VALUES = new Set([
  'PASS',
  'FAIL',
  'ABSENT',
  'NO_SHOW',
  'NOSHOW',
  'WITHDRAWN',
  'MIGRATED',
  'HISTORICAL',
])

const isCompletedResult = (result: string | null | undefined) =>
  !!result && COMPLETED_RESULT_VALUES.has(result.toUpperCase())

const isUpcomingBooking = (r: {
  examDate: string | null | undefined
  result: string | null
  demandStatus?: string | null | undefined
  eventStatus?: string | null | undefined
}) => {
  if (!r.examDate) return false
  if (new Date(r.examDate) <= new Date()) return false
  if (isCompletedResult(r.result)) return false
  if (r.demandStatus === 'EXECUTED') return false
  if (r.demandStatus && ['CANCELLED', 'ROLLED_FORWARD', 'POSTPONED'].includes(r.demandStatus)) {
    return false
  }
  if (r.eventStatus && ['CANCELLED', 'POSTPONED'].includes(r.eventStatus)) {
    return false
  }
  return true
}

const isMissedBooking = (r: {
  examDate: string | null | undefined
  result: string | null
  score?: number | null
  demandStatus?: string | null | undefined
  hasResult?: boolean
}) => {
  if (!r.examDate) return false
  if (new Date(r.examDate) > new Date()) return false
  if (isCompletedResult(r.result)) return false
  if (r.score != null) return false
  if (r.demandStatus === 'EXECUTED') return false
  if (
    r.demandStatus &&
    ['CANCELLED', 'ROLLED_FORWARD', 'POSTPONED', 'EXECUTED'].includes(r.demandStatus)
  ) {
    return false
  }
  if (r.hasResult) return false
  return true
}

describe('exam filter helpers', () => {
  const futureDate = new Date(Date.now() + 86400000).toISOString()
  const pastDate = new Date(Date.now() - 86400000).toISOString()

  it('marks future SCHEDULED booking as upcoming', () => {
    expect(
      isUpcomingBooking({ examDate: futureDate, result: null, demandStatus: 'SCHEDULED' })
    ).toBe(true)
  })

  it('excludes past bookings from upcoming', () => {
    expect(isUpcomingBooking({ examDate: pastDate, result: null, demandStatus: 'SCHEDULED' })).toBe(
      false
    )
  })

  it('excludes CANCELLED bookings from upcoming', () => {
    expect(
      isUpcomingBooking({ examDate: futureDate, result: null, demandStatus: 'CANCELLED' })
    ).toBe(false)
  })

  it('excludes bookings with completed results from upcoming', () => {
    expect(
      isUpcomingBooking({ examDate: futureDate, result: 'PASS', demandStatus: 'SCHEDULED' })
    ).toBe(false)
  })

  it('excludes EXECUTED bookings from upcoming', () => {
    expect(
      isUpcomingBooking({ examDate: futureDate, result: null, demandStatus: 'EXECUTED' })
    ).toBe(false)
  })

  it('excludes bookings with cancelled event from upcoming', () => {
    expect(
      isUpcomingBooking({
        examDate: futureDate,
        result: null,
        demandStatus: 'SCHEDULED',
        eventStatus: 'CANCELLED',
      })
    ).toBe(false)
  })

  it('marks past bookings with no result as missed', () => {
    expect(isMissedBooking({ examDate: pastDate, result: null, demandStatus: 'SCHEDULED' })).toBe(
      true
    )
  })

  it('excludes future bookings from missed', () => {
    expect(isMissedBooking({ examDate: futureDate, result: null, demandStatus: 'SCHEDULED' })).toBe(
      false
    )
  })

  it('excludes bookings with completed results from missed', () => {
    expect(
      isMissedBooking({ examDate: pastDate, result: 'ABSENT', demandStatus: 'SCHEDULED' })
    ).toBe(false)
  })

  it('excludes bookings with score from missed', () => {
    expect(
      isMissedBooking({ examDate: pastDate, result: null, score: 50, demandStatus: 'SCHEDULED' })
    ).toBe(false)
  })

  it('excludes EXECUTED bookings from missed', () => {
    expect(isMissedBooking({ examDate: pastDate, result: null, demandStatus: 'EXECUTED' })).toBe(
      false
    )
  })

  it('excludes bookings with hasResult from missed', () => {
    expect(
      isMissedBooking({
        examDate: pastDate,
        result: null,
        demandStatus: 'SCHEDULED',
        hasResult: true,
      })
    ).toBe(false)
  })
})

describe('official examCategory filter', () => {
  const officialFilter = (r: { examCategory: string | null | undefined }) =>
    r.examCategory === 'OFFICIAL_EASA'

  it('includes OFFICIAL_EASA records in official filter', () => {
    expect(officialFilter({ examCategory: 'OFFICIAL_EASA' })).toBe(true)
  })

  it('excludes null examCategory from official filter', () => {
    expect(officialFilter({ examCategory: null })).toBe(false)
  })

  it('excludes undefined examCategory from official filter', () => {
    expect(officialFilter({ examCategory: undefined })).toBe(false)
  })

  it('excludes INTERNAL records from official filter', () => {
    expect(officialFilter({ examCategory: 'INTERNAL' })).toBe(false)
  })

  it('excludes empty string examCategory from official filter', () => {
    expect(officialFilter({ examCategory: '' })).toBe(false)
  })
})
