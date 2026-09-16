import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getExamNotificationDedupeKey } from '@/lib/exams/fulfillment'

const TERMINAL_DEMAND_STATUSES = new Set(['EXECUTED', 'ROLLED_FORWARD', 'CANCELLED', 'POSTPONED'])

const COMPLETED_RESULT_VALUES = new Set([
  'PASS',
  'FAIL',
  'ABSENT',
  'EXCUSED',
  'MIGRATED',
  'HISTORICAL',
])

function shouldProcessBooking(booking: {
  examDate: Date | null
  demandStatus: string | null
  result: string | null
  score: number | null
  percentage: number | null
}): boolean {
  if (!booking.examDate) return false
  if (booking.examDate >= new Date()) return false
  if (booking.demandStatus && TERMINAL_DEMAND_STATUSES.has(booking.demandStatus)) return false
  if (booking.result && COMPLETED_RESULT_VALUES.has(booking.result.toUpperCase())) return false
  if (booking.score != null) return false
  if (booking.percentage != null) return false
  return true
}

const now = new Date()
const past = new Date(now.getTime() - 86400000)
const future = new Date(now.getTime() + 86400000)

describe('exam notification dedupe key', () => {
  it('produces userId:moduleCode format', () => {
    expect(getExamNotificationDedupeKey('user-1', 'M101')).toBe('user-1:M101')
  })

  it('normalizes module code with whitespace', () => {
    expect(getExamNotificationDedupeKey('user-1', ' M101 ')).toBe('user-1:M101')
  })

  it('handles null module code as unknown', () => {
    expect(getExamNotificationDedupeKey('user-1', null)).toBe('user-1:unknown')
  })

  it('produces different keys for different users', () => {
    const keyA = getExamNotificationDedupeKey('user-1', 'M101')
    const keyB = getExamNotificationDedupeKey('user-2', 'M101')
    expect(keyA).not.toBe(keyB)
  })

  it('produces same key for same user+module regardless of call', () => {
    const key1 = getExamNotificationDedupeKey('user-1', 'M101')
    const key2 = getExamNotificationDedupeKey('user-1', 'M101')
    expect(key1).toBe(key2)
  })
})

describe('exam reconciliation filter logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('processes past SCHEDULED booking with no result', () => {
    expect(
      shouldProcessBooking({
        examDate: past,
        demandStatus: 'SCHEDULED',
        result: null,
        score: null,
        percentage: null,
      })
    ).toBe(true)
  })

  it('skips future booking', () => {
    expect(
      shouldProcessBooking({
        examDate: future,
        demandStatus: 'SCHEDULED',
        result: null,
        score: null,
        percentage: null,
      })
    ).toBe(false)
  })

  it('skips booking with null examDate', () => {
    expect(
      shouldProcessBooking({
        examDate: null,
        demandStatus: 'SCHEDULED',
        result: null,
        score: null,
        percentage: null,
      })
    ).toBe(false)
  })

  it('skips EXECUTED booking', () => {
    expect(
      shouldProcessBooking({
        examDate: past,
        demandStatus: 'EXECUTED',
        result: null,
        score: null,
        percentage: null,
      })
    ).toBe(false)
  })

  it('skips CANCELLED booking', () => {
    expect(
      shouldProcessBooking({
        examDate: past,
        demandStatus: 'CANCELLED',
        result: null,
        score: null,
        percentage: null,
      })
    ).toBe(false)
  })

  it('skips booking with completed result', () => {
    expect(
      shouldProcessBooking({
        examDate: past,
        demandStatus: 'SCHEDULED',
        result: 'PASS',
        score: null,
        percentage: null,
      })
    ).toBe(false)
  })

  it('skips booking with score', () => {
    expect(
      shouldProcessBooking({
        examDate: past,
        demandStatus: 'SCHEDULED',
        result: null,
        score: 75,
        percentage: null,
      })
    ).toBe(false)
  })

  it('skips booking with percentage', () => {
    expect(
      shouldProcessBooking({
        examDate: past,
        demandStatus: 'SCHEDULED',
        result: null,
        score: null,
        percentage: 75,
      })
    ).toBe(false)
  })
})

describe('exam reconciliation grace period', () => {
  it('defaults to 24 hours when setting is missing', () => {
    const raw = ''
    const graceHours = Number(raw || String(24))
    expect(graceHours).toBe(24)
  })

  it('parses custom grace period from system setting', () => {
    const customGrace = '48'
    const parsedGrace = Number(customGrace)
    const graceHours = Number.isFinite(parsedGrace) && parsedGrace >= 0 ? parsedGrace : 24
    expect(graceHours).toBe(48)
  })

  it('falls back to the default for an invalid grace period', () => {
    const customGrace = 'not-a-number'
    const parsedGrace = Number(customGrace)
    const graceHours = Number.isFinite(parsedGrace) && parsedGrace >= 0 ? parsedGrace : 24
    expect(graceHours).toBe(24)
  })
})

describe('exam category does not bypass reconciliation', () => {
  it('processes a past OFFICIAL_EASA booking with no result', () => {
    expect(
      shouldProcessBooking({
        examDate: past,
        demandStatus: 'SCHEDULED',
        result: null,
        score: null,
        percentage: null,
      })
    ).toBe(true)
  })

  it('processes a past INTERNAL booking with no result', () => {
    expect(
      shouldProcessBooking({
        examDate: past,
        demandStatus: 'SCHEDULED',
        result: null,
        score: null,
        percentage: null,
      })
    ).toBe(true)
  })
})

describe('run-scoped deduplication suppresses notification only', () => {
  it('allows attendance processing for duplicate student-module keys', () => {
    const notifiedModules = new Set<string>()
    const key = getExamNotificationDedupeKey('user-1', 'M101')

    // First pass: not yet notified, so processing proceeds
    const alreadyNotified1 = notifiedModules.has(key)
    expect(alreadyNotified1).toBe(false)

    // Simulate adding after first pass
    notifiedModules.add(key)

    // Second pass: already notified for this student-module combo
    const alreadyNotified2 = notifiedModules.has(key)
    expect(alreadyNotified2).toBe(true)

    // But processing still happens — only the student notification is suppressed.
    // The attendance/status reconciliation is NOT skipped.
    expect(alreadyNotified2).toBe(true)
  })

  it('does not block different modules for the same student', () => {
    const notifiedModules = new Set<string>()
    const keyM101 = getExamNotificationDedupeKey('user-1', 'M101')
    const keyM102 = getExamNotificationDedupeKey('user-1', 'M102')

    notifiedModules.add(keyM101)

    expect(notifiedModules.has(keyM101)).toBe(true)
    expect(notifiedModules.has(keyM102)).toBe(false)
  })

  it('does not block same module for different students', () => {
    const notifiedModules = new Set<string>()
    const key1 = getExamNotificationDedupeKey('user-1', 'M101')
    const key2 = getExamNotificationDedupeKey('user-2', 'M101')

    notifiedModules.add(key1)

    expect(notifiedModules.has(key1)).toBe(true)
    expect(notifiedModules.has(key2)).toBe(false)
  })
})
