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

import { PATCH } from '@/app/api/staff/exams/internal/questions/[questionId]/review/route'
import { getAuthSession } from '@/lib/auth/helpers'

describe('/staff/exams/internal/questions/:questionId/review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } })
    prismaMock.internalExamQuestion.findUnique.mockResolvedValue(null as any)
  })

  it('returns 403 when unauthenticated', async () => {
    ;(getAuthSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/exams/internal/questions/q1/review', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, { params: Promise.resolve({ questionId: 'q1' }) } as any)
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid input', async () => {
    const req = new NextRequest('http://localhost/staff/exams/internal/questions/q1/review', {
      method: 'PATCH',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ questionId: 'q1' }) } as any)
    expect(res.status).toBe(400)
  })

  it('returns 404 when question not found', async () => {
    prismaMock.internalExamQuestion.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/staff/exams/internal/questions/q1/review', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'APPROVED' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ questionId: 'q1' }) } as any)
    expect(res.status).toBe(404)
  })

  it('returns 200 for valid review', async () => {
    prismaMock.internalExamQuestion.findUnique.mockResolvedValueOnce({ id: 'q1' } as any)
    prismaMock.internalExamQuestion.update.mockResolvedValueOnce({ id: 'q1', status: 'APPROVED' } as any)
    const req = new NextRequest('http://localhost/staff/exams/internal/questions/q1/review', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'APPROVED' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ questionId: 'q1' }) } as any)
    expect(res.status).toBe(200)
  })
})
