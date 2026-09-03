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
  getPoolWithDetails: vi.fn().mockResolvedValue({ id: 'pool-1', name: 'Pool A' }),
}))

vi.mock('@/lib/validation/schemas', () => ({
  updateExamPoolSchema: vi.fn(),
  validateBody: vi.fn(),
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

import { GET, PATCH } from '@/app/api/staff/exam-pools/[id]/route'
import { requireStaff } from '@/lib/auth/helpers'
import { validateBody } from '@/lib/validation/schemas'

describe('/staff/exam-pools/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
    prismaMock.examPool.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated (GET)', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exam-pools/1')
    const res = await GET(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(401)
  })

  it('returns 200 with data', async () => {
    const req = new NextRequest('http://localhost/staff/exam-pools/1')
    const res = await GET(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 401 when unauthenticated (PATCH)', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exam-pools/1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    ;(validateBody as any).mockReturnValueOnce({ success: false, error: 'Invalid input' })
    const req = new NextRequest('http://localhost/staff/exam-pools/1', {
      method: 'PATCH',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await PATCH(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(400)
  })

  it('returns 404 when pool not found', async () => {
    ;(validateBody as any).mockReturnValueOnce({ success: true, data: { name: 'Updated' } })
    prismaMock.examPool.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/staff/exam-pools/1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(404)
  })

  it('returns 200 for valid update', async () => {
    ;(validateBody as any).mockReturnValueOnce({ success: true, data: { name: 'Updated' } })
    prismaMock.examPool.findUnique.mockResolvedValueOnce({ id: '1', eventId: 'evt-1', name: 'Old' } as any)
    prismaMock.examPool.update.mockResolvedValueOnce({ id: '1', name: 'Updated' } as any)
    const req = new NextRequest('http://localhost/staff/exam-pools/1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(200)
  })
})
