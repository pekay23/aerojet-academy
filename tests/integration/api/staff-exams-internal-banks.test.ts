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
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiCreated: vi.fn((data) => ({ status: 201, json: () => Promise.resolve(data) })),
  apiPaginated: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((msg, status) => ({ status: status || 400, json: () => Promise.resolve({ error: msg }) })),
  apiUnauthorized: vi.fn(() => ({ status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) })),
  apiForbidden: vi.fn(() => ({ status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) })),
  apiNotFound: vi.fn((msg) => ({ status: 404, json: () => Promise.resolve({ error: msg }) })),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
  withErrorHandler: vi.fn((fn) => {
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

vi.mock('@/lib/easa/category-selection', () => ({
  getInternalBankCategoryCode: vi.fn().mockReturnValue('CAT1'),
  normalizeCategoryCode: vi.fn().mockReturnValue('CAT1'),
}))

import { GET, POST } from '@/app/api/staff/exams/internal/banks/route.ts'
import { requireStaff } from '@/lib/auth/helpers'

describe('/staff/exams/internal/banks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
    prismaMock.internalExamBank.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated (GET)', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exams/internal/banks')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when internal exams disabled', async () => {
    const { isInternalExamSystemEnabled } = await import('@/lib/internal-exam/engine')
    ;(isInternalExamSystemEnabled as any).mockResolvedValueOnce(false)
    const req = new NextRequest('http://localhost/staff/exams/internal/banks')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 with data', async () => {
    prismaMock.internalExamBank.findMany.mockResolvedValue([{
      id: '1',
      name: 'Bank 1',
      course: { id: 'c1', name: 'Course', code: 'C1' },
      ruleOverride: null,
      _count: { questions: 10, sessions: 0 }
    }] as any)
    prismaMock.internalExamQuestion.groupBy.mockResolvedValue([] as any)
    const req = new NextRequest('http://localhost/staff/exams/internal/banks')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 401 when unauthenticated (POST)', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exams/internal/banks', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    const req = new NextRequest('http://localhost/staff/exams/internal/banks', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 201 for valid creation', async () => {
    prismaMock.internalExamBank.create.mockResolvedValueOnce({ id: '1' } as any)
    const req = new NextRequest('http://localhost/staff/exams/internal/banks', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'c1', name: 'Bank 1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
