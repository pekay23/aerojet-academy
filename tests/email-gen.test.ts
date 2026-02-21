import { describe, it, expect } from 'vitest'
import { generateAcademyEmail } from '../lib/auth/helpers'

describe('generateAcademyEmail', () => {
  it('should generate initials for 2 names', () => {
    expect(generateAcademyEmail('John', '', 'Doe')).toBe('j.doe@aerojet-academy.com')
  })

  it('should generate initials for 3 names', () => {
    expect(generateAcademyEmail('John', 'Quincy', 'Adams')).toBe('j.q.adams@aerojet-academy.com')
  })

  it('should handle multiple initials from first name field', () => {
    expect(generateAcademyEmail('John Paul', 'Quincy', 'Adams')).toBe(
      'j.p.q.adams@aerojet-academy.com'
    )
  })

  it('should handle initials provided as input', () => {
    expect(generateAcademyEmail('J.', 'Q.', 'Adams')).toBe('j.q.adams@aerojet-academy.com')
  })

  it('should handle middle names with multiple parts', () => {
    expect(generateAcademyEmail('John', 'M. Q.', 'Public')).toBe('j.m.q.public@aerojet-academy.com')
  })

  it('should handle multiple middle names', () => {
    expect(generateAcademyEmail('Alice', 'Marie Louise', 'Smith')).toBe(
      'a.m.l.smith@aerojet-academy.com'
    )
  })

  it('should handle no initials case (fallback)', () => {
    expect(generateAcademyEmail('', '', 'Doe')).toBe('doe@aerojet-academy.com')
  })
})
