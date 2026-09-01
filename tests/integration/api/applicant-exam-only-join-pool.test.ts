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
vi.mock('@/lib/pools/join', () => ({ joinPool: vi.fn().mockResolvedValue({ success: true }) }))
vi.mock('@/lib/pools/validation', () => ({ validatePoolJoin: vi.fn().mockResolvedValue({ valid: true }) }))
vi.mock('@/lib/enrollment/pathway', () => ({ promoteIfFirstExamActivity: vi.fn().mockResolvedValue(false) }))
vi.mock('@/lib/easa/category-selection', () => ({
  categoryMatchesTarget: vi.fn().mockReturnValue(false),
  getStudentTargetCategoryCodes: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiCreated: vi.fn((data) => ({ status: 201, json: () => Promise.resolve(data) })),
  apiPaginated: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
  parseSorting: vi.fn().mockReturnValue({ sortBy: 'createdAt', sortOrder: 'desc' }),
  parseSearch: vi.fn().mockReturnValue(undefined),
  apiError: vi.fn((message, status) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
  apiUnauthorized: vi.fn(() => ({ status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) })),
  apiForbidden: vi.fn(() => ({ status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) })),
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
import { POST } from '@/app/api/applicant/exam-only/join-pool/route.ts'
import { requireApplicant } from '@/lib/auth/helpers'
import { validatePoolJoin } from '@/lib/pools/validation'
import { getStudentTargetCategoryCodes, categoryMatchesTarget } from '@/lib/easa/category-selection'
import { joinPool } from '@/lib/pools/join'

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost/applicant/exam-only/join-pool', {
    method: 'POST',
    body: JSON.stringify(body),
  })

describe('/applicant/exam-only/join-pool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireApplicant as any).mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'APPLICANT' })
    prismaMock.examComponent.findFirst.mockResolvedValue(null as any)
    prismaMock.examPool.findUnique.mockResolvedValue(null as any)
    prismaMock.wallet.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireApplicant as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(401)
  })

  it('returns 400 when poolId or moduleCode is missing', async () => {
    const res = await POST(makeRequest({ invalid: 'data' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when no exam component matches the module code', async () => {
    prismaMock.examComponent.findFirst.mockResolvedValueOnce(null as any)
    const res = await POST(makeRequest({ poolId: 'pool-1', moduleCode: 'MOD-1' }))
    expect(res.status).toBe(404)
  })

  it('returns 403 when the module is not part of the licence pathway', async () => {
    prismaMock.examComponent.findFirst.mockResolvedValueOnce({
      id: 'ec-1',
      categoryCode: 'CAT-A',
      course: { code: 'MOD-1' },
    } as any)
    ;(getStudentTargetCategoryCodes as any).mockResolvedValueOnce(['CAT-B'])
    ;(categoryMatchesTarget as any).mockReturnValueOnce(false)
    const res = await POST(makeRequest({ poolId: 'pool-1', moduleCode: 'MOD-1' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 when validation fails', async () => {
    prismaMock.examComponent.findFirst.mockResolvedValueOnce({
      id: 'ec-1',
      categoryCode: 'CAT-A',
      course: { code: 'MOD-1' },
    } as any)
    ;(getStudentTargetCategoryCodes as any).mockResolvedValueOnce([])
    ;(validatePoolJoin as any).mockResolvedValueOnce({ valid: false, error: 'Pool is full' })
    const res = await POST(makeRequest({ poolId: 'pool-1', moduleCode: 'MOD-1' }))
    expect(res.status).toBe(400)
  })

  it('joins the pool successfully and returns 200', async () => {
    prismaMock.examComponent.findFirst.mockResolvedValueOnce({
      id: 'ec-1',
      categoryCode: 'CAT-A',
      course: { code: 'MOD-1' },
    } as any)
    ;(getStudentTargetCategoryCodes as any).mockResolvedValueOnce([])
    ;(validatePoolJoin as any).mockResolvedValueOnce({ valid: true })
    ;(joinPool as any).mockResolvedValueOnce({
      success: true,
      membership: { id: 'm-1' },
      autoConfirmed: true,
      pool: { id: 'pool-1' },
    })
    const res = await POST(makeRequest({ poolId: 'pool-1', moduleCode: 'MOD-1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.membershipId).toBe('m-1')
    expect(body.autoConfirmed).toBe(true)
  })
})
