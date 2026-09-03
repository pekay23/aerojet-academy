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

import { GET, PUT } from '@/app/api/staff/exams/sittings/[id]/seats/route'
import { getAuthSession } from '@/lib/auth/helpers'

describe('/staff/exams/sittings/:id/seats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } })
    prismaMock.examSitting.findUnique.mockResolvedValue(null as any)
    prismaMock.examSittingAssignment.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated (GET)', async () => {
    ;(getAuthSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/exams/sittings/1/seats')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when sitting not found', async () => {
    prismaMock.examSitting.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/staff/exams/sittings/1/seats')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 200 with data', async () => {
    prismaMock.examSitting.findUnique.mockResolvedValueOnce({
      id: '1',
      event: { id: 'evt-1', name: 'Event' },
      examComponent: { id: 'ec1', code: 'MOD1', name: 'Module' },
      assignments: []
    } as any)
    const req = new NextRequest('http://localhost/staff/exams/sittings/1/seats')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 401 when unauthenticated (PUT)', async () => {
    ;(getAuthSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/exams/sittings/1/seats', {
      method: 'PUT',
      body: JSON.stringify({}),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid data', async () => {
    const req = new NextRequest('http://localhost/staff/exams/sittings/1/seats', {
      method: 'PUT',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 when sitting not found (PUT)', async () => {
    prismaMock.examSitting.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/staff/exams/sittings/1/seats', {
      method: 'PUT',
      body: JSON.stringify({ assignments: [] }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 200 for valid update', async () => {
    prismaMock.examSitting.findUnique.mockResolvedValueOnce({ id: '1' } as any)
    prismaMock.$transaction.mockResolvedValueOnce([])
    prismaMock.examSittingAssignment.findMany.mockResolvedValueOnce([])
    const req = new NextRequest('http://localhost/staff/exams/sittings/1/seats', {
      method: 'PUT',
      body: JSON.stringify({ assignments: [] }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
  })
})
