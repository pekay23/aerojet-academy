import { describe, it, expect } from 'vitest'
import { parseStudentId } from '@/lib/students/id-generator'

describe('Student ID', () => {
  it('parses valid student ID', () => {
    const result = parseStudentId('AJA-2026-0001')
    expect(result).toEqual({ year: 2026, sequence: 1 })
  })

  it('parses high sequence number', () => {
    const result = parseStudentId('AJA-2026-1234')
    expect(result).toEqual({ year: 2026, sequence: 1234 })
  })

  it('returns null for invalid format', () => {
    expect(parseStudentId('INVALID')).toBeNull()
    expect(parseStudentId('AJA-2026')).toBeNull()
    expect(parseStudentId('AJA-2026-ABCD')).toBeNull()
  })
})
