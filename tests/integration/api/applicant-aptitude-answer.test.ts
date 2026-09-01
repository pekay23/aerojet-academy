vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message, status) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
  withErrorHandler: vi.fn((fn) => {
    return async (req, ctx) => {
      try {
        const resolvedCtx = ctx?.params ? { ...ctx, params: await ctx.params } : ctx
        return await fn(req, resolvedCtx)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Unauthorized') return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }
        if (message === 'Forbidden') return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }
        return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) }
      }
    }
  }),
}))

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'APPLICANT' } }),
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
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE', PAYMENT_APPROVE: 'PAYMENT_APPROVE', ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE' },
}))

vi.mock('@/lib/email/service', () => ({
  sendPaymentApprovedEmail: vi.fn(),
  sendPaymentRejectedEmail: vi.fn(),
  sendStudentPromotionEmail: vi.fn(),
  sendActivationEmail: vi.fn(),
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/applicant/aptitude/answer/route.ts'
import { requireAuth } from '@/lib/auth/helpers'

describe('/applicant/aptitude/answer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireAuth as any).mockResolvedValue({ id: 'user-1', role: 'APPLICANT' })
    prismaMock.aptitudeTestSession.findUnique.mockResolvedValue(null as any)
    prismaMock.aptitudeAnswer.update.mockResolvedValue({} as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/applicant/aptitude/answer', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    const req = new NextRequest('http://localhost/applicant/aptitude/answer', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when session not found', async () => {
    prismaMock.aptitudeTestSession.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/answer', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'ck1a1b2c3d0001aaaa1111a', questionId: 'ck1a1b2c3d0001aaaa1111b', answer: 'A' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 403 when session belongs to another user', async () => {
    prismaMock.aptitudeTestSession.findUnique.mockResolvedValueOnce({ id: 'ck1a1b2c3d0001aaaa1111a', userId: 'user-2', status: 'IN_PROGRESS' } as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/answer', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'ck1a1b2c3d0001aaaa1111a', questionId: 'ck1a1b2c3d0001aaaa1111b', answer: 'A' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 with saved:true on success', async () => {
    prismaMock.aptitudeTestSession.findUnique.mockResolvedValueOnce({ id: 'ck1a1b2c3d0001aaaa1111a', userId: 'user-1', status: 'IN_PROGRESS' } as any)
    prismaMock.aptitudeAnswer.update.mockResolvedValueOnce({ sessionId: 'ck1a1b2c3d0001aaaa1111a', questionId: 'ck1a1b2c3d0001aaaa1111b', selectedAnswer: 'A' } as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/answer', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'ck1a1b2c3d0001aaaa1111a', questionId: 'ck1a1b2c3d0001aaaa1111b', answer: 'A' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ saved: true })
  })
})
