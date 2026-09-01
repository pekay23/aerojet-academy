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

vi.mock('@/lib/exams/scheduler', () => ({
  detectSchedulingConflicts: vi.fn().mockResolvedValue({ conflicts: [] })
}))

import { GET } from '@/app/api/staff/exam-sittings/conflicts/route.ts'
import { requireStaff } from '@/lib/auth/helpers'

describe('/staff/exam-sittings/conflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
  })

  it('returns 500 when unauthenticated', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exam-sittings/conflicts')
    const res = await GET(req)
    expect(res.status).toBe(500)
  })

  it('returns 400 when eventId is missing', async () => {
    const req = new NextRequest('http://localhost/staff/exam-sittings/conflicts')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 with data', async () => {
    const req = new NextRequest('http://localhost/staff/exam-sittings/conflicts?eventId=1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })
})
