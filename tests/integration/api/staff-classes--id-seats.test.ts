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

import { GET } from '@/app/api/staff/classes/[id]/seats/route.ts'
import { getAuthSession } from '@/lib/auth/helpers'

describe('/staff/classes/:id/seats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } })
    prismaMock.class.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(getAuthSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/classes/1/seats')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 200 with data when class exists', async () => {
    prismaMock.class.findUnique.mockResolvedValue({ id: '1', course: { code: 'C1', name: 'Course 1' }, classroom: { seats: [] } } as any)
    prismaMock.attendanceRecord.findMany.mockResolvedValue([])
    const req = new NextRequest('http://localhost/staff/classes/1/seats')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 404 when class not found', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/classes/999/seats')
    const res = await GET(req, { params: Promise.resolve({ id: '999' }) })
    expect(res.status).toBe(404)
  })
})
