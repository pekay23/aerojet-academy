import { describe, it, expect } from 'vitest'
import { expandClass, expandMany, parseDays } from '@/lib/scheduling/recurrence'

describe('parseDays', () => {
  it('parses a single day abbreviation', () => {
    expect(parseDays('MON')).toEqual(new Set(['MON']))
  })

  it('parses multiple comma-separated days', () => {
    expect(parseDays('MON,WED,FRI')).toEqual(new Set(['MON', 'WED', 'FRI']))
  })

  it('parses multiple semicolon-separated days', () => {
    expect(parseDays('MON;WED;FRI')).toEqual(new Set(['MON', 'WED', 'FRI']))
  })

  it('handles mixed-case input', () => {
    expect(parseDays('mon,Wed,fri')).toEqual(new Set(['MON', 'WED', 'FRI']))
  })

  it('trims surrounding whitespace', () => {
    expect(parseDays(' MON , WED , FRI ')).toEqual(new Set(['MON', 'WED', 'FRI']))
  })

  it('preserves invalid day strings as-is after normalisation', () => {
    expect(parseDays('MON,XXX,WED')).toEqual(new Set(['MON', 'XXX', 'WED']))
  })

  it('returns empty set for empty string', () => {
    expect(parseDays('')).toEqual(new Set())
  })

  it('returns empty set for null', () => {
    expect(parseDays(null)).toEqual(new Set())
  })

  it('returns empty set for undefined', () => {
    expect(parseDays(undefined)).toEqual(new Set())
  })
})

describe('expandClass', () => {
  const baseClass = {
    id: 'class-1',
    name: 'Test Class',
    instructorId: 'inst-1',
    classroomId: 'room-1',
    startDate: new Date('2026-09-01T09:00:00'),
    endDate: new Date('2026-09-01T11:00:00'),
    recurrenceType: 'NONE' as const,
    recurrenceDays: null,
    recurrenceUntil: null,
  }

  it('returns a single occurrence for non-recurring class inside window', () => {
    const result = expandClass(baseClass, new Date('2026-09-01'), new Date('2026-09-30'))
    expect(result).toHaveLength(1)
    expect(result[0].start).toEqual(new Date('2026-09-01T09:00:00'))
    expect(result[0].end).toEqual(new Date('2026-09-01T11:00:00'))
    expect(result[0].classId).toBe('class-1')
    expect(result[0].className).toBe('Test Class')
  })

  it('returns empty array for non-recurring class outside window', () => {
    const result = expandClass(baseClass, new Date('2026-10-01'), new Date('2026-10-31'))
    expect(result).toHaveLength(0)
  })

  it('expands daily recurrence across window', () => {
    const cls = {
      ...baseClass,
      recurrenceType: 'DAILY' as const,
    }
    const result = expandClass(cls, new Date('2026-09-01'), new Date('2026-09-05'))
    expect(result).toHaveLength(5)
    expect(result[0].start).toEqual(new Date('2026-09-01T09:00:00'))
    expect(result[4].start).toEqual(new Date('2026-09-05T09:00:00'))
  })

  it('expands weekly recurrence on specified days', () => {
    const cls = {
      ...baseClass,
      recurrenceType: 'WEEKLY' as const,
      recurrenceDays: 'TUE,THU',
    }
    const result = expandClass(cls, new Date('2026-09-01'), new Date('2026-09-14'))
    expect(result).toHaveLength(4)
    expect(result.map((o) => o.start.getDate())).toEqual([1, 3, 8, 10])
  })

  it('expands monthly recurrence', () => {
    const cls = {
      ...baseClass,
      recurrenceType: 'MONTHLY' as const,
    }
    const result = expandClass(cls, new Date('2026-09-01'), new Date('2026-11-30'))
    expect(result).toHaveLength(4)
    expect(result.map((o) => o.start.getDate())).toEqual([1, 1, 31, 30])
  })

  it('stops at recurrenceUntil when it is before windowEnd', () => {
    const cls = {
      ...baseClass,
      recurrenceType: 'DAILY' as const,
      recurrenceUntil: new Date('2026-09-10'),
    }
    const result = expandClass(cls, new Date('2026-09-01'), new Date('2026-09-30'))
    expect(result).toHaveLength(10)
    expect(result[9].start).toEqual(new Date('2026-09-10T09:00:00'))
  })

  it('returns empty when both dates are before window', () => {
    const cls = {
      ...baseClass,
      startDate: new Date('2026-08-01T09:00:00'),
      endDate: new Date('2026-08-01T11:00:00'),
    }
    const result = expandClass(cls, new Date('2026-09-01'), new Date('2026-09-30'))
    expect(result).toHaveLength(0)
  })

  it('returns empty when both dates are after window', () => {
    const cls = {
      ...baseClass,
      startDate: new Date('2026-10-01T09:00:00'),
      endDate: new Date('2026-10-01T11:00:00'),
    }
    const result = expandClass(cls, new Date('2026-09-01'), new Date('2026-09-30'))
    expect(result).toHaveLength(0)
  })

  it('handles biweekly recurrence as daily when no day filter is set', () => {
    const cls = {
      ...baseClass,
      recurrenceType: 'BIWEEKLY' as const,
    }
    const result = expandClass(cls, new Date('2026-09-01'), new Date('2026-09-03'))
    expect(result).toHaveLength(3)
  })

  it('handles recurrenceType undefined as non-recurring', () => {
    const cls = {
      ...baseClass,
      recurrenceType: undefined,
    }
    const result = expandClass(cls, new Date('2026-09-01'), new Date('2026-09-30'))
    expect(result).toHaveLength(1)
  })

  it('handles recurrenceType null as non-recurring', () => {
    const cls = {
      ...baseClass,
      recurrenceType: null,
    }
    const result = expandClass(cls, new Date('2026-09-01'), new Date('2026-09-30'))
    expect(result).toHaveLength(1)
  })

  it('does not emit occurrences when recurrenceDays contains only invalid strings', () => {
    const cls = {
      ...baseClass,
      recurrenceType: 'WEEKLY' as const,
      recurrenceDays: 'XXX,YYY',
    }
    const result = expandClass(cls, new Date('2026-09-01'), new Date('2026-09-07'))
    expect(result).toHaveLength(0)
  })

  it('caps iteration at 365 to prevent runaway loops', () => {
    const cls = {
      ...baseClass,
      recurrenceType: 'DAILY' as const,
      startDate: new Date('2026-09-01T09:00:00'),
      endDate: new Date('2026-09-01T11:00:00'),
    }
    const result = expandClass(cls, new Date('2026-09-01'), new Date('2027-09-01'))
    expect(result).toHaveLength(365)
  })
})

describe('expandMany', () => {
  it('flattens occurrences from multiple classes', () => {
    const classes = [
      {
        id: '1',
        name: 'Class A',
        instructorId: null,
        classroomId: null,
        startDate: new Date('2026-09-01T09:00:00'),
        endDate: new Date('2026-09-01T11:00:00'),
        recurrenceType: 'NONE' as const,
        recurrenceDays: null,
        recurrenceUntil: null,
      },
      {
        id: '2',
        name: 'Class B',
        instructorId: null,
        classroomId: null,
        startDate: new Date('2026-09-02T09:00:00'),
        endDate: new Date('2026-09-02T11:00:00'),
        recurrenceType: 'NONE' as const,
        recurrenceDays: null,
        recurrenceUntil: null,
      },
    ]
    const result = expandMany(classes, new Date('2026-09-01'), new Date('2026-09-30'))
    expect(result).toHaveLength(2)
    expect(result[0].classId).toBe('1')
    expect(result[1].classId).toBe('2')
  })

  it('returns empty array for empty input', () => {
    const result = expandMany([], new Date('2026-09-01'), new Date('2026-09-30'))
    expect(result).toHaveLength(0)
  })
})
