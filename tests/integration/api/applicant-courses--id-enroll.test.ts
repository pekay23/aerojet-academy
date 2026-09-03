vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ message, error: message }),
  })),
  withErrorHandler: vi.fn((fn: any) => {
    return async (req: any, ctx?: any) => {
      try {
        const resolvedCtx = ctx?.params ? { ...ctx, params: await ctx.params } : ctx
        return await fn(req, resolvedCtx)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Unauthorized')
          return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }
        if (message === 'Forbidden')
          return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }
        return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) }
      }
    }
  }),
}))

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi
    .fn()
    .mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'APPLICANT' } }),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi.fn().mockResolvedValue({ id: 'user-1', role: 'APPLICANT' }),
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
  trackPaymentSubmitted: vi.fn().mockResolvedValue({ success: true }),
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/applicant/courses/[id]/enroll/route'
import { requireApplicant } from '@/lib/auth/helpers'

const params = { params: Promise.resolve({ id: '1' }) }

describe('/applicant/courses/:id/enroll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireApplicant as any).mockResolvedValue({ id: 'user-1', role: 'APPLICANT' })
    prismaMock.course.findUnique.mockResolvedValue({
      id: '1',
      code: 'ABC',
      name: 'Test Course',
      price: 100,
      currency: 'EUR',
    } as any)
    prismaMock.enrollment.findFirst.mockResolvedValue(null as any)
    prismaMock.enrollment.create.mockResolvedValue({
      id: 'enroll-1',
      userId: 'user-1',
      courseId: '1',
      status: 'PENDING',
    } as any)
    prismaMock.payment.create.mockResolvedValue({
      id: 'pay-1',
      userId: 'user-1',
      amount: 100,
      currency: 'EUR',
      status: 'PENDING',
    } as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireApplicant as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/applicant/courses/1/enroll', {
      method: 'POST',
      body: JSON.stringify({ proofUrl: 'https://example.com/proof.jpg' }),
    })
    const res = await POST(req, params)
    expect(res.status).toBe(401)
  })

  it('returns 400 when proofUrl is missing', async () => {
    const req = new NextRequest('http://localhost/applicant/courses/1/enroll', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, params)
    expect(res.status).toBe(400)
  })

  it('returns 404 when course not found', async () => {
    prismaMock.course.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/applicant/courses/1/enroll', {
      method: 'POST',
      body: JSON.stringify({ proofUrl: 'https://example.com/proof.jpg' }),
    })
    const res = await POST(req, params)
    expect(res.status).toBe(404)
  })

  it('creates enrollment and payment on valid input', async () => {
    const req = new NextRequest('http://localhost/applicant/courses/1/enroll', {
      method: 'POST',
      body: JSON.stringify({ proofUrl: 'https://example.com/proof.jpg' }),
    })
    const res = await POST(req, params)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })
})
