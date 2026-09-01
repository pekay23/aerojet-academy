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
vi.mock('@/lib/pools/waitlist', () => ({ joinWaitlist: vi.fn().mockResolvedValue({ success: true, entry: { id: 'waitlist-1' } }) }))
vi.mock('@/lib/easa/category-selection', () => ({ categoryMatchesTarget: vi.fn().mockReturnValue(true), getStudentTargetCategoryCodes: vi.fn().mockResolvedValue([]) }))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiCreated: vi.fn((data) => ({ status: 201, json: () => Promise.resolve(data) })),
  apiPaginated: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
  apiUnauthorized: vi.fn(() => ({ status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) })),
  apiForbidden: vi.fn(() => ({ status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) })),
  apiError: vi.fn((message, status) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
  apiNotFound: vi.fn((message) => ({ status: 404, json: () => Promise.resolve({ message, error: message }) })),
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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/applicant/exam-only/join-waitlist/route.ts'
import { requireApplicant } from '@/lib/auth/helpers'

describe('/applicant/exam-only/join-waitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireApplicant as any).mockResolvedValue({ id: 'user-1', role: 'APPLICANT' })
    prismaMock.examComponent.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireApplicant as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/applicant/exam-only/join-waitlist', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing poolId or moduleCode', async () => {
    const req = new NextRequest('http://localhost/applicant/exam-only/join-waitlist', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid module code', async () => {
    prismaMock.examComponent.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/applicant/exam-only/join-waitlist', {
      method: 'POST',
      body: JSON.stringify({ poolId: 'pool-1', moduleCode: 'INVALID' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 when successfully joining waitlist', async () => {
    prismaMock.examComponent.findUnique.mockResolvedValueOnce({ id: 'comp-1', categoryCode: 'ATPL' } as any)
    const req = new NextRequest('http://localhost/applicant/exam-only/join-waitlist', {
      method: 'POST',
      body: JSON.stringify({ poolId: 'pool-1', moduleCode: 'MOD-001' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.entry).toBeDefined()
  })
})
