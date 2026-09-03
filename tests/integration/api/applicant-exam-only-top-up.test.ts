vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiCreated: vi.fn((data: any) => ({ status: 201, json: () => Promise.resolve(data) })),
  apiPaginated: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
  apiUnauthorized: vi.fn(() => ({
    status: 401,
    json: () => Promise.resolve({ error: 'Unauthorized' }),
  })),
  apiForbidden: vi.fn(() => ({ status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) })),
  apiError: vi.fn((message: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ message, error: message }),
  })),
  apiNotFound: vi.fn((message) => ({
    status: 404,
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
  trackPaymentSubmitted: vi.fn().mockResolvedValue({ success: true }),
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/applicant/exam-only/top-up/route'
import { requireApplicant } from '@/lib/auth/helpers'

describe('/applicant/exam-only/top-up', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireApplicant as any).mockResolvedValue({ id: 'user-1', role: 'APPLICANT' })
    prismaMock.paymentMethod.findUnique.mockResolvedValue(null as any)
    prismaMock.user.findUnique.mockResolvedValue({
      registrationCode: 'REG-123',
      programmeChoice: 'ATPL',
    } as any)
    prismaMock.payment.findFirst.mockResolvedValue(null as any)
    prismaMock.payment.create.mockResolvedValue({
      id: 'pay-1',
      amount: 500,
      currency: 'EUR',
      userId: 'user-1',
      paymentMethod: 'BANK_TRANSFER',
    } as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireApplicant as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/applicant/exam-only/top-up', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when amount is missing', async () => {
    const req = new NextRequest('http://localhost/applicant/exam-only/top-up', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when amount is negative', async () => {
    const req = new NextRequest('http://localhost/applicant/exam-only/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount: -5 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when no registration code is found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      registrationCode: null,
      programmeChoice: null,
    } as any)
    const req = new NextRequest('http://localhost/applicant/exam-only/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount: 500 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when a pending top-up already exists', async () => {
    prismaMock.payment.findFirst.mockResolvedValueOnce({ id: 'existing', status: 'PENDING' } as any)
    const req = new NextRequest('http://localhost/applicant/exam-only/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount: 500 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/pending top-up/i)
  })

  it('creates a pending top-up and returns success', async () => {
    const req = new NextRequest('http://localhost/applicant/exam-only/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount: 500, paymentMethodId: 'pm-1', proofUrl: 'https://x/y.png' }),
    })
    prismaMock.paymentMethod.findUnique.mockResolvedValueOnce({ id: 'pm-1', label: 'CARD' } as any)
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.paymentId).toBe('pay-1')
    expect(body.registrationCode).toBe('REG-123')
    expect(prismaMock.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          amount: 500,
          referenceType: 'WALLET_TOPUP',
          paymentMethod: 'CARD',
          proofUrl: 'https://x/y.png',
        }),
      })
    )
  })
})
