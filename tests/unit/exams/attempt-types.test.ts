import { describe, it, expect } from 'vitest'
import {
  ATTEMPT_FIRST,
  ATTEMPT_RESIT_1,
  ATTEMPT_RESIT_2,
  ATTEMPT_LABELS,
  mergeAttemptType,
  normalizeAttemptType,
  resolveAttemptType,
  formatAttemptType,
} from '@/lib/exams/attempt-types'

describe('normalizeAttemptType', () => {
  it('returns null for null', () => {
    expect(normalizeAttemptType(null)).toBe(null)
  })

  it('returns null for undefined', () => {
    expect(normalizeAttemptType(undefined)).toBe(null)
  })

  it('returns null for empty string', () => {
    expect(normalizeAttemptType('')).toBe(null)
  })

  it('returns null for whitespace-only string', () => {
    expect(normalizeAttemptType('   ')).toBe(null)
  })

  it('normalizes canonical FIRST', () => {
    expect(normalizeAttemptType('FIRST')).toBe(ATTEMPT_FIRST)
  })

  it('normalizes canonical RESIT_1', () => {
    expect(normalizeAttemptType('RESIT_1')).toBe(ATTEMPT_RESIT_1)
  })

  it('normalizes canonical RESIT_2', () => {
    expect(normalizeAttemptType('RESIT_2')).toBe(ATTEMPT_RESIT_2)
  })

  it('normalizes legacy first_attempt synonym', () => {
    expect(normalizeAttemptType('first_attempt')).toBe(ATTEMPT_FIRST)
  })

  it('normalizes space-separated FIRST ATTEMPT synonym', () => {
    expect(normalizeAttemptType('FIRST ATTEMPT')).toBe(ATTEMPT_FIRST)
  })

  it('normalizes hyphen-separated FIRST-ATTEMPT synonym', () => {
    expect(normalizeAttemptType('FIRST-ATTEMPT')).toBe(ATTEMPT_FIRST)
  })

  it('normalizes legacy FIRST_ATTEMPT_INITIAL with spaces', () => {
    expect(normalizeAttemptType('FIRST ATTEMPT INITIAL')).toBe(ATTEMPT_FIRST)
  })

  it('normalizes numeric shorthand 1st', () => {
    expect(normalizeAttemptType('1ST')).toBe(ATTEMPT_FIRST)
  })

  it('normalizes legacy FIRST_ATTEMPT uppercase synonym', () => {
    expect(normalizeAttemptType('FIRST_ATTEMPT')).toBe(ATTEMPT_FIRST)
  })

  it('normalizes legacy INITIAL synonym (case-insensitive)', () => {
    expect(normalizeAttemptType('Initial')).toBe(ATTEMPT_FIRST)
  })

  it('normalizes FIRST_RESIT synonym to RESIT_1', () => {
    expect(normalizeAttemptType('first_resit')).toBe(ATTEMPT_RESIT_1)
  })

  it('normalizes space-separated FIRST RESIT synonym to RESIT_1', () => {
    expect(normalizeAttemptType('FIRST RESIT')).toBe(ATTEMPT_RESIT_1)
  })

  it('normalizes SECOND_RESIT synonym to RESIT_2', () => {
    expect(normalizeAttemptType('second_resit')).toBe(ATTEMPT_RESIT_2)
  })

  it('normalizes space-separated SECOND RESIT synonym to RESIT_2', () => {
    expect(normalizeAttemptType('SECOND RESIT')).toBe(ATTEMPT_RESIT_2)
  })

  it('normalizes RESIT (bare) to RESIT_1', () => {
    expect(normalizeAttemptType('RESIT')).toBe(ATTEMPT_RESIT_1)
  })

  it('normalizes RESIT_1 numeric forms to RESIT_1', () => {
    expect(normalizeAttemptType('resit-1')).toBe(ATTEMPT_RESIT_1)
  })

  it('maps RESIT_3 to RETAKE_1 (after max 2 resits)', () => {
    expect(normalizeAttemptType('RESIT_3')).toBe('RETAKE_1')
    expect(normalizeAttemptType('THIRD_RESIT')).toBe('RETAKE_1')
  })

  it('maps RESIT_4 to RETAKE_2', () => {
    expect(normalizeAttemptType('RESIT_4')).toBe('RETAKE_2')
  })

  it('normalizes RETAKE_N forms', () => {
    expect(normalizeAttemptType('RETAKE_1')).toBe('RETAKE_1')
    expect(normalizeAttemptType('RETAKE_2')).toBe('RETAKE_2')
    expect(normalizeAttemptType('RETAKE_5')).toBe('RETAKE_5')
  })

  it('returns null for unknown nonblank value', () => {
    expect(normalizeAttemptType('BOGUS')).toBe(null)
  })

  it('trims whitespace before matching', () => {
    expect(normalizeAttemptType('  first  ')).toBe(ATTEMPT_FIRST)
    expect(normalizeAttemptType(' resit_2 ')).toBe(ATTEMPT_RESIT_2)
  })
})

describe('resolveAttemptType', () => {
  it('returns ATTEMPT_FIRST for null', () => {
    expect(resolveAttemptType(null)).toBe(ATTEMPT_FIRST)
  })

  it('returns ATTEMPT_FIRST for undefined', () => {
    expect(resolveAttemptType(undefined)).toBe(ATTEMPT_FIRST)
  })

  it('returns ATTEMPT_FIRST for empty string', () => {
    expect(resolveAttemptType('')).toBe(ATTEMPT_FIRST)
  })

  it('returns ATTEMPT_FIRST for whitespace-only string', () => {
    expect(resolveAttemptType('   ')).toBe(ATTEMPT_FIRST)
  })

  it('returns canonical value for known input', () => {
    expect(resolveAttemptType('first_attempt')).toBe(ATTEMPT_FIRST)
    expect(resolveAttemptType('second_resit')).toBe(ATTEMPT_RESIT_2)
  })

  it('returns RETAKE_1 for RESIT_3', () => {
    expect(resolveAttemptType('RESIT_3')).toBe('RETAKE_1')
  })

  it('throws on unknown nonblank value', () => {
    expect(() => resolveAttemptType('BOGUS')).toThrow('Unknown attempt type')
  })

  it('preserves legacy merge equivalence — first_attempt and FIRST resolve to same key', () => {
    expect(resolveAttemptType('FIRST')).toBe(resolveAttemptType('first_attempt'))
    expect(resolveAttemptType('FIRST')).toBe(resolveAttemptType('INITIAL'))
    expect(resolveAttemptType('FIRST')).toBe(resolveAttemptType('INITIAL_ATTEMPT'))
  })

  it('preserves legacy merge equivalence — resit synonyms resolve to same key', () => {
    expect(resolveAttemptType('FIRST_RESIT')).toBe(resolveAttemptType('RESIT_1'))
    expect(resolveAttemptType('RESIT')).toBe(resolveAttemptType('RESIT_1'))
    expect(resolveAttemptType('SECOND_RESIT')).toBe(resolveAttemptType('RESIT_2'))
  })
})

describe('formatAttemptType', () => {
  it('returns "First Attempt" for null', () => {
    expect(formatAttemptType(null)).toBe(ATTEMPT_LABELS[ATTEMPT_FIRST])
  })

  it('returns "First Attempt" for undefined', () => {
    expect(formatAttemptType(undefined)).toBe(ATTEMPT_LABELS[ATTEMPT_FIRST])
  })

  it('returns "First Attempt" for empty string', () => {
    expect(formatAttemptType('')).toBe(ATTEMPT_LABELS[ATTEMPT_FIRST])
  })

  it('returns "First Attempt" for whitespace-only string', () => {
    expect(formatAttemptType('   ')).toBe(ATTEMPT_LABELS[ATTEMPT_FIRST])
  })

  it('returns canonical label for FIRST', () => {
    expect(formatAttemptType('FIRST')).toBe('First Attempt')
  })

  it('returns canonical label for RESIT_1', () => {
    expect(formatAttemptType(ATTEMPT_RESIT_1)).toBe('Resit 1')
  })

  it('returns canonical label for RESIT_2', () => {
    expect(formatAttemptType(ATTEMPT_RESIT_2)).toBe('Resit 2')
  })

  it('returns canonical label for RETAKE_N', () => {
    expect(formatAttemptType('RETAKE_1')).toBe('Retake 1')
    expect(formatAttemptType('RETAKE_2')).toBe('Retake 2')
    expect(formatAttemptType('RETAKE_5')).toBe('Retake 5')
  })

  it('returns canonical label for legacy synonyms', () => {
    expect(formatAttemptType('first_attempt')).toBe('First Attempt')
    expect(formatAttemptType('FIRST_RESIT')).toBe('Resit 1')
  })

  it('maps legacy RESIT_3 to Retake 1', () => {
    expect(formatAttemptType('RESIT_3')).toBe('Retake 1')
  })

  it('returns em-dash for unknown nonblank value', () => {
    expect(formatAttemptType('BOGUS')).toBe('—')
  })

  it('returns em-dash for unknown nonblank value with whitespace', () => {
    expect(formatAttemptType('  unknown_type  ')).toBe('—')
  })
})

describe('mergeAttemptType', () => {
  it('returns ATTEMPT_FIRST for null', () => {
    expect(mergeAttemptType(null)).toBe(ATTEMPT_FIRST)
  })

  it('returns ATTEMPT_FIRST for undefined', () => {
    expect(mergeAttemptType(undefined)).toBe(ATTEMPT_FIRST)
  })

  it('returns ATTEMPT_FIRST for empty string', () => {
    expect(mergeAttemptType('')).toBe(ATTEMPT_FIRST)
  })

  it('returns ATTEMPT_FIRST for whitespace-only string', () => {
    expect(mergeAttemptType('   ')).toBe(ATTEMPT_FIRST)
  })

  it('returns canonical ATTEMPT_FIRST for known FIRST input', () => {
    expect(mergeAttemptType('FIRST')).toBe(ATTEMPT_FIRST)
  })

  it('returns canonical values for known resit inputs', () => {
    expect(mergeAttemptType('RESIT_1')).toBe(ATTEMPT_RESIT_1)
    expect(mergeAttemptType('RESIT_2')).toBe(ATTEMPT_RESIT_2)
  })

  it('returns RETAKE_N for retake inputs', () => {
    expect(mergeAttemptType('RETAKE_1')).toBe('RETAKE_1')
    expect(mergeAttemptType('RETAKE_2')).toBe('RETAKE_2')
  })

  it('returns canonical values for legacy synonyms', () => {
    expect(mergeAttemptType('first_attempt')).toBe(ATTEMPT_FIRST)
    expect(mergeAttemptType('FIRST_RESIT')).toBe(ATTEMPT_RESIT_1)
    expect(mergeAttemptType('second_resit')).toBe(ATTEMPT_RESIT_2)
  })

  it('returns stable uppercase string for unknown nonblank values', () => {
    const result = mergeAttemptType('BOGUS')
    expect(result).not.toBe(ATTEMPT_FIRST)
    expect(result).toBe('BOGUS')
  })

  it('returns trimmed uppercase for unknown values with surrounding whitespace', () => {
    expect(mergeAttemptType('  unknown  ')).toBe('UNKNOWN')
  })

  it('never crashes on any string input', () => {
    expect(() => mergeAttemptType('!@#$%^&*()')).not.toThrow()
    expect(() => mergeAttemptType('')).not.toThrow()
    expect(() => mergeAttemptType(null)).not.toThrow()
  })

  it('preserves merge equivalence for legacy synonyms', () => {
    expect(mergeAttemptType('FIRST')).toBe(mergeAttemptType('first_attempt'))
    expect(mergeAttemptType('FIRST')).toBe(mergeAttemptType('INITIAL'))
    expect(mergeAttemptType('FIRST_RESIT')).toBe(mergeAttemptType('RESIT_1'))
    expect(mergeAttemptType('SECOND_RESIT')).toBe(mergeAttemptType('RESIT_2'))
  })

  it('returns distinct values for distinct unknowns (no collision)', () => {
    expect(mergeAttemptType('TYPE_A')).not.toBe(mergeAttemptType('TYPE_B'))
  })
})
