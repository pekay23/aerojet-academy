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

vi.mock('@/lib/pools/standard-pools', () => ({
  createStandardPools: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/validation/schemas', () => ({
  createExamEventSchema: vi.fn(),
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

import { GET, POST } from '@/app/api/staff/exam-events/route'
import { requireStaff } from '@/lib/auth/helpers'
import { validateBody } from '@/lib/validation/schemas'

describe('/staff/exam-events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
    prismaMock.examEvent.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated (GET)', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exam-events')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with data', async () => {
    prismaMock.examEvent.findMany.mockResolvedValue([{ id: '1' }] as any)
    prismaMock.examEvent.count.mockResolvedValue(1)
    const req = new NextRequest('http://localhost/staff/exam-events?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 401 when unauthenticated (POST)', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exam-events', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    ;(validateBody as any).mockReturnValueOnce({ success: false, error: 'Invalid input' })
    const req = new NextRequest('http://localhost/staff/exam-events', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 409 for duplicate event name', async () => {
    ;(validateBody as any).mockReturnValueOnce({
      success: true,
      data: { name: 'Event 1', startDate: '2025-01-01', endDate: '2025-01-02', paymentDeadline: '2025-01-01' }
    })
    prismaMock.examEvent.findFirst.mockResolvedValueOnce({ id: '1', name: 'Event 1' } as any)
    const req = new NextRequest('http://localhost/staff/exam-events', {
      method: 'POST',
      body: JSON.stringify({ name: 'Event 1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it('returns 201 for valid creation', async () => {
    ;(validateBody as any).mockReturnValueOnce({
      success: true,
      data: { name: 'Event 1', startDate: '2025-01-01', endDate: '2025-01-02', paymentDeadline: '2025-01-01' }
    })
    prismaMock.examEvent.findFirst.mockResolvedValueOnce(null as any)
    prismaMock.examEvent.create.mockResolvedValueOnce({ id: '1' } as any)
    const req = new NextRequest('http://localhost/staff/exam-events', {
      method: 'POST',
      body: JSON.stringify({ name: 'Event 1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
