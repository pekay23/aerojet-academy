import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi
    .fn()
    .mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } }),
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
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    PAYMENT_APPROVE: 'PAYMENT_APPROVE',
    ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE',
  },
}))

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
  PERMISSIONS: { MANAGE_EXAMS: 'manage:exams' },
}))

vi.mock('@/lib/events/go-no-go', () => ({
  evaluateGoNoGo: vi.fn().mockResolvedValue({ recommendation: 'go' }),
  executeGo: vi.fn().mockResolvedValue({ success: true }),
  executeNoGo: vi.fn().mockResolvedValue({ success: true }),
  executePostponement: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiCreated: vi.fn((data: any) => ({ status: 201, json: () => Promise.resolve(data) })),
  apiPaginated: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((msg: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ error: msg }),
  })),
  apiUnauthorized: vi.fn(() => ({
    status: 401,
    json: () => Promise.resolve({ error: 'Unauthorized' }),
  })),
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
        if (message === 'Unauthorized')
          return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }
        if (message === 'Forbidden')
          return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }
        return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) }
      }
    }
  }),
}))

import { POST } from '@/app/api/staff/exam-events/[id]/go-no-go/route'
import { requirePermission } from '@/lib/auth/permissions'

describe('/staff/exam-events/:id/go-no-go', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requirePermission as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
    prismaMock.examEvent.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requirePermission as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exam-events/1/go-no-go', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(401)
  })

  it('returns 403 when permission denied', async () => {
    ;(requirePermission as any).mockRejectedValueOnce(new Error('Permission denied: MANAGE_EXAMS'))
    const req = new NextRequest('http://localhost/staff/exam-events/1/go-no-go', {
      method: 'POST',
      body: JSON.stringify({ decision: 'go' }),
    })
    const res = await POST(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid decision', async () => {
    const req = new NextRequest('http://localhost/staff/exam-events/1/go-no-go', {
      method: 'POST',
      body: JSON.stringify({ decision: 'invalid' }),
    })
    const res = await POST(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(400)
  })

  it('returns 404 when event not found', async () => {
    prismaMock.examEvent.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/staff/exam-events/1/go-no-go', {
      method: 'POST',
      body: JSON.stringify({ decision: 'go' }),
    })
    const res = await POST(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(404)
  })

  it('returns 200 for go decision', async () => {
    prismaMock.examEvent.findUnique.mockResolvedValueOnce({ id: '1' } as any)
    const req = new NextRequest('http://localhost/staff/exam-events/1/go-no-go', {
      method: 'POST',
      body: JSON.stringify({ decision: 'go' }),
    })
    const res = await POST(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(200)
  })

  it('returns 200 for no_go decision', async () => {
    prismaMock.examEvent.findUnique.mockResolvedValueOnce({ id: '1' } as any)
    const req = new NextRequest('http://localhost/staff/exam-events/1/go-no-go', {
      method: 'POST',
      body: JSON.stringify({ decision: 'no_go' }),
    })
    const res = await POST(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(200)
  })

  it('returns 400 for postpone without dates', async () => {
    prismaMock.examEvent.findUnique.mockResolvedValueOnce({ id: '1' } as any)
    const req = new NextRequest('http://localhost/staff/exam-events/1/go-no-go', {
      method: 'POST',
      body: JSON.stringify({ decision: 'postpone' }),
    })
    const res = await POST(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(400)
  })

  it('returns 200 for postpone with dates', async () => {
    prismaMock.examEvent.findUnique.mockResolvedValueOnce({ id: '1' } as any)
    const req = new NextRequest('http://localhost/staff/exam-events/1/go-no-go', {
      method: 'POST',
      body: JSON.stringify({
        decision: 'postpone',
        newStartDate: '2025-02-01',
        newEndDate: '2025-02-02',
      }),
    })
    const res = await POST(req, { params: { id: '1' } } as any)
    expect(res.status).toBe(200)
  })
})
