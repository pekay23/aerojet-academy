import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi.fn(),
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
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    PAYMENT_APPROVE: 'PAYMENT_APPROVE',
    ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE',
  },
}))

vi.mock('@/lib/email/service', () => ({
  sendPaymentApprovedEmail: vi.fn(),
  sendPaymentRejectedEmail: vi.fn(),
  sendStudentPromotionEmail: vi.fn(),
  sendActivationEmail: vi.fn(),
}))

vi.mock('@/lib/analytics/events', () => ({
  trackEnrollment: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimitByUser: vi.fn().mockReturnValue({ allowed: true }),
}))

import { POST } from '@/app/api/staff/enrollments/batch/route'
import { getAuthSession } from '@/lib/auth/helpers'

describe('/staff/enrollments/batch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(getAuthSession as any).mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' },
    })
  })

  it('returns 401 when unauthenticated', async () => {
    ;(getAuthSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/staff/enrollments/batch', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not staff role', async () => {
    ;(getAuthSession as any).mockResolvedValueOnce({
      user: { id: 'user-1', email: 'test@test.com', role: 'STUDENT' },
    })
    const req = new NextRequest('http://localhost/api/staff/enrollments/batch', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid input', async () => {
    const req = new NextRequest('http://localhost/api/staff/enrollments/batch', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when no valid students found', async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([] as any)
    const req = new NextRequest('http://localhost/api/staff/enrollments/batch', {
      method: 'POST',
      body: JSON.stringify({ studentIds: ['s1'], courseIds: ['c1'] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when no valid courses found', async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([{ id: 's1' }] as any)
    prismaMock.course.findMany.mockResolvedValueOnce([] as any)
    const req = new NextRequest('http://localhost/api/staff/enrollments/batch', {
      method: 'POST',
      body: JSON.stringify({ studentIds: ['s1'], courseIds: ['c1'] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 on successful batch enrollment', async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([{ id: 's1' }] as any)
    prismaMock.course.findMany.mockResolvedValueOnce([
      { id: 'c1', code: 'ATPL101', price: 500 },
    ] as any)
    prismaMock.enrollment.createMany.mockResolvedValueOnce({ count: 1 } as any)
    prismaMock.enrollment.findMany.mockResolvedValueOnce([
      { id: 'e1', userId: 's1', courseId: 'c1' },
    ] as any)
    const req = new NextRequest('http://localhost/api/staff/enrollments/batch', {
      method: 'POST',
      body: JSON.stringify({ studentIds: ['s1'], courseIds: ['c1'] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })
})
