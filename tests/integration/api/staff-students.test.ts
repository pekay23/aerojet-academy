import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
  hashPassword: vi.fn(),
  generateToken: vi.fn(),
  generateTempPassword: vi.fn(),
  generateAcademyEmail: vi.fn(),
  getClientIp: vi.fn(),
  verifyPassword: vi.fn(),
  generateStudentId: vi.fn(),
  checkRateLimit: vi.fn(),
  requireStudent: vi.fn(),
  requireInstructor: vi.fn(),
  requireApplicant: vi.fn(),
  requireAdminOrStaff: vi.fn(),
  requireExaminer: vi.fn(),
  generateRegistrationCode: vi.fn(),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message: any, status?: number) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
  apiPaginated: vi.fn((data, total, page, limit) => ({
    status: 200,
    json: () =>
      Promise.resolve({
        success: true,
        data,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }),
  })),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
  parseSorting: vi.fn().mockReturnValue({ sortBy: 'createdAt', sortOrder: 'desc' }),
  parseSearch: vi.fn().mockReturnValue(undefined),
  withErrorHandler: vi.fn((fn: any) => {
    return async (req: any, ctx?: any) => {
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

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimitByUser: vi.fn().mockReturnValue({ allowed: true, resetAt: Date.now() + 60000 }),
  rateLimitAsync: vi.fn(),
  rateLimit: vi.fn(),
  rateLimitAuth: vi.fn(),
  rateLimitByIP: vi.fn(),
  rateLimitByIPAsync: vi.fn(),
  getRateLimitInfo: vi.fn(),
  clearRateLimit: vi.fn(),
}))

import { GET } from '@/app/api/staff/students/route'
import { getAuthSession } from '@/lib/auth/helpers'
import { rateLimitByUser } from '@/lib/security/rate-limit'

describe('GET /api/staff/students', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
    ;(rateLimitByUser as any).mockReturnValue({ allowed: true, resetAt: Date.now() + 60000 })
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/students', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('returns 403 when wrong role', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce({ user: { id: '1', role: 'STUDENT' } })
      const req = new NextRequest('http://localhost/api/staff/students', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(403)
    })

    it('returns 429 when rate limited', async () => {
      ;(rateLimitByUser as any).mockReturnValueOnce({ allowed: false, resetAt: Date.now() + 60000 })
      const req = new NextRequest('http://localhost/api/staff/students', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(429)
    })

    it('returns paginated list', async () => {
      prismaMock.user.findMany.mockResolvedValueOnce([{ id: '1' }] as any)
      prismaMock.user.count.mockResolvedValueOnce(1)
      const req = new NextRequest('http://localhost/api/staff/students?page=1&limit=20', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns empty list when no data', async () => {
      prismaMock.user.findMany.mockResolvedValueOnce([])
      prismaMock.user.count.mockResolvedValueOnce(0)
      const req = new NextRequest('http://localhost/api/staff/students', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })
  })
})
