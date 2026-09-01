import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } }),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
  requireInstructor: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requirePermission: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  verifyPassword: vi.fn().mockResolvedValue(true),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
  generateStudentId: vi.fn().mockReturnValue('STU-001'),
}))

import { POST } from '@/app/api/staff/classes/[id]/batch-enroll/route.ts'
import { getAuthSession } from '@/lib/auth/helpers'

describe('POST /api/staff/classes/[id]/batch-enroll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } })
  })

  it('returns 400 for invalid input (missing cohortId)', async () => {
    const req = new NextRequest('http://localhost/staff/classes/1/batch-enroll', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid cohort selected')
  })

  it('returns 404 when class not found', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/classes/999/batch-enroll', {
      method: 'POST',
      body: JSON.stringify({ cohortId: 'cl00000000000000000000000' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: '999' }) })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Class not found')
  })
})
