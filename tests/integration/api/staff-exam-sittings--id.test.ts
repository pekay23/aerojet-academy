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

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  logAuditEvent: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE', PAYMENT_APPROVE: 'PAYMENT_APPROVE', ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE' },
}))

import { GET, PATCH } from '@/app/api/staff/exam-sittings/[id]/route'
import { requireStaff } from '@/lib/auth/helpers'

describe('/staff/exam-sittings/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
    prismaMock.examSitting.findUnique.mockResolvedValue(null as any)
  })

  it('returns 500 when unauthenticated (GET)', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exam-sittings/1')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(500)
  })

  it('returns 404 when sitting not found', async () => {
    prismaMock.examSitting.findUnique.mockResolvedValue(null as any)
    const req = new NextRequest('http://localhost/staff/exam-sittings/1')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 200 with data', async () => {
    prismaMock.examSitting.findUnique.mockResolvedValue({ id: '1', examComponent: { course: {} }, examiner: { user: {} }, assignments: [] } as any)
    const req = new NextRequest('http://localhost/staff/exam-sittings/1')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 500 when unauthenticated (PATCH)', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exam-sittings/1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(500)
  })

  it('returns 400 for empty body', async () => {
    prismaMock.examSitting.findUnique.mockResolvedValue({ id: '1', eventId: 'evt-1' } as any)
    const req = new NextRequest('http://localhost/staff/exam-sittings/1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(400)
  })

  it('returns 200 for valid update', async () => {
    prismaMock.examSitting.findUnique.mockResolvedValue({ id: '1', eventId: 'evt-1' } as any)
    prismaMock.examSitting.update.mockResolvedValue({ id: '1' } as any)
    const req = new NextRequest('http://localhost/staff/exam-sittings/1', {
      method: 'PATCH',
      body: JSON.stringify({ venue: 'Room A' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
  })
})
