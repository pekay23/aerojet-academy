import { describe, it, expect, vi } from 'vitest'

// Mock Prisma — generateAcademyEmail calls prisma.user.findFirst for uniqueness check
vi.mock('@/lib/prisma/db-base', () => ({
  default: {
    user: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
  prismaBase: {
    user: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}))

import { generateAcademyEmail } from '../lib/auth/helpers'

describe('generateAcademyEmail', () => {
  it('should generate initials for 2 names', async () => {
    expect(await generateAcademyEmail('John', '', 'Doe')).toBe('j.doe@aerojet-academy.com')
  })

  it('should generate initials for 3 names', async () => {
    expect(await generateAcademyEmail('John', 'Quincy', 'Adams')).toBe(
      'j.q.adams@aerojet-academy.com'
    )
  })

  it('should handle multiple initials from first name field', async () => {
    expect(await generateAcademyEmail('John Paul', 'Quincy', 'Adams')).toBe(
      'j.p.q.adams@aerojet-academy.com'
    )
  })

  it('should handle initials provided as input', async () => {
    expect(await generateAcademyEmail('J.', 'Q.', 'Adams')).toBe('j.q.adams@aerojet-academy.com')
  })

  it('should handle middle names with multiple parts', async () => {
    expect(await generateAcademyEmail('John', 'M. Q.', 'Public')).toBe(
      'j.m.q.public@aerojet-academy.com'
    )
  })

  it('should handle multiple middle names', async () => {
    expect(await generateAcademyEmail('Alice', 'Marie Louise', 'Smith')).toBe(
      'a.m.l.smith@aerojet-academy.com'
    )
  })

  it('should handle no initials case (fallback)', async () => {
    expect(await generateAcademyEmail('', '', 'Doe')).toBe('doe@aerojet-academy.com')
  })
})
