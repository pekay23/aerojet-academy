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
  apiPaginated: vi.fn((data, total, page, limit, extra) => ({ status: 200, json: () => Promise.resolve({ data, total, page, limit, ...extra }) })),
  apiError: vi.fn((message, status) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
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
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
}))

import { GET } from '@/app/api/staff/admissions/bonding/route.ts'
import { requireStaff } from '@/lib/auth/helpers'

describe('GET /api/staff/admissions/bonding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
  })

  describe('GET', () => {
    it('returns paginated bonding contracts', async () => {
      prismaMock.bondingContract.findMany.mockResolvedValueOnce([{ id: '1' }] as any)
      prismaMock.bondingContract.count.mockResolvedValueOnce(1)
      prismaMock.bondingContract.groupBy.mockResolvedValueOnce([{ status: 'ISSUED', _count: { status: 1 } }])
      const req = new NextRequest('http://localhost/api/staff/admissions/bonding?page=1&limit=20', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.data).toHaveLength(1)
    })

    it('returns empty list when no data', async () => {
      prismaMock.bondingContract.findMany.mockResolvedValueOnce([])
      prismaMock.bondingContract.count.mockResolvedValueOnce(0)
      prismaMock.bondingContract.groupBy.mockResolvedValueOnce([])
      const req = new NextRequest('http://localhost/api/staff/admissions/bonding', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.data).toHaveLength(0)
    })

    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/admissions/bonding', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(401)
    })
  })
})
