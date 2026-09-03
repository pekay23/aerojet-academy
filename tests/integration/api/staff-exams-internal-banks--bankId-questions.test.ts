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

vi.mock('@/lib/internal-exam/engine', () => ({
  isInternalExamSystemEnabled: vi.fn().mockResolvedValue(true),
}))

import { GET, POST } from '@/app/api/staff/exams/internal/banks/[bankId]/questions/route'
import { getAuthSession } from '@/lib/auth/helpers'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

describe('/staff/exams/internal/banks/:bankId/questions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } })
    prismaMock.internalExamQuestion.findUnique.mockResolvedValue(null as any)
  })

  it('returns 403 when unauthenticated (GET)', async () => {
    ;(getAuthSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/exams/internal/banks/b1/questions')
    const res = await GET(req, { params: Promise.resolve({ bankId: 'b1' }) } as any)
    expect(res.status).toBe(403)
  })

  it('returns 200 with data', async () => {
    prismaMock.internalExamQuestion.findMany.mockResolvedValue([{ id: '1', text: 'Question 1' }] as any)
    const req = new NextRequest('http://localhost/staff/exams/internal/banks/b1/questions')
    const res = await GET(req, { params: Promise.resolve({ bankId: 'b1' }) } as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 403 when unauthenticated (POST)', async () => {
    ;(getAuthSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/exams/internal/banks/b1/questions', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({ bankId: 'b1' }) } as any)
    expect(res.status).toBe(403)
  })

  it('returns 201 with errors for invalid input', async () => {
    const req = new NextRequest('http://localhost/staff/exams/internal/banks/b1/questions', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({ bankId: 'b1' }) } as any)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 201 for valid creation', async () => {
    prismaMock.internalExamQuestion.create.mockResolvedValueOnce({ id: '1' } as any)
    const req = new NextRequest('http://localhost/staff/exams/internal/banks/b1/questions', {
      method: 'POST',
      body: JSON.stringify({ text: 'Question 1', options: ['A', 'B', 'C'], correctAnswer: 'A' }),
    })
    const res = await POST(req, { params: Promise.resolve({ bankId: 'b1' }) } as any)
    expect(res.status).toBe(201)
  })
})
