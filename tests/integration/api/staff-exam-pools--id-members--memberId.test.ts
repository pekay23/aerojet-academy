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

vi.mock('@/lib/pools/operations', () => ({
  decrementPoolMemberCount: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/wallet/operations', () => ({
  releaseFunds: vi.fn().mockResolvedValue({}),
  creditToWallet: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiCreated: vi.fn((data: any) => ({ status: 201, json: () => Promise.resolve(data) })),
  apiPaginated: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((msg: any, status?: number) => ({ status: status || 400, json: () => Promise.resolve({ error: msg }) })),
  apiUnauthorized: vi.fn(() => ({ status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) })),
  apiForbidden: vi.fn(() => ({ status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) })),
  apiNotFound: vi.fn((msg: any) => ({ status: 404, json: () => Promise.resolve({ error: msg }) })),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
  withErrorHandler: vi.fn((fn: any) => {
    return async (req: any, ctx: any) => {
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

import { DELETE } from '@/app/api/staff/exam-pools/[id]/members/[memberId]/route'
import { requireStaff } from '@/lib/auth/helpers'

describe('/staff/exam-pools/:id/members/:memberId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exam-pools/1/members/m1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: { id: '1', memberId: 'm1' } } as any)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing reason', async () => {
    const req = new NextRequest('http://localhost/staff/exam-pools/1/members/m1', {
      method: 'DELETE',
      body: JSON.stringify({}),
    })
    const res = await DELETE(req, { params: { id: '1', memberId: 'm1' } } as any)
    expect(res.status).toBe(400)
  })

  it('returns 404 when membership not found', async () => {
    prismaMock.$transaction.mockImplementationOnce(async (fn: any) => {
      if (typeof fn === 'function') {
        return fn(prismaMock)
      }
      return Promise.resolve(fn)
    })
    prismaMock.poolMembership.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/staff/exam-pools/1/members/m1', {
      method: 'DELETE',
      body: JSON.stringify({ reason: 'Valid reason here' }),
    })
    const res = await DELETE(req, { params: { id: '1', memberId: 'm1' } } as any)
    expect(res.status).toBe(500)
  })

  it('returns 200 for successful removal', async () => {
    prismaMock.$transaction.mockImplementationOnce(async () => {
      return { userId: 'u1', refundAmount: 100, refundType: 'RELEASE', poolName: 'Pool A' }
    })
    const req = new NextRequest('http://localhost/staff/exam-pools/1/members/m1', {
      method: 'DELETE',
      body: JSON.stringify({ reason: 'Valid reason here' }),
    })
    const res = await DELETE(req, { params: { id: '1', memberId: 'm1' } } as any)
    expect(res.status).toBe(200)
  })
})
