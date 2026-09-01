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
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
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
}))

import { POST } from '@/app/api/staff/admissions/import/validate/route.ts'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('POST /api/staff/admissions/import/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/admissions/import/validate', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 for invalid input', async () => {
      const req = new NextRequest('http://localhost/api/staff/admissions/import/validate', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ invalid: 'data' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('validates rows and returns results', async () => {
      const req = new NextRequest('http://localhost/api/staff/admissions/import/validate', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          rows: [
            { firstName: 'test', lastName: 'test', email: 'test@example.com', programmeChoice: 'FULL_TIME_4YEAR' }
          ]
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.results).toBeDefined()
      expect(json.results[0].valid).toBe(true)
    })
  })
})
