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

import { POST } from '@/app/api/staff/admissions/aptitude/sessions/[id]/void/route.ts'
import { requireStaff } from '@/lib/auth/helpers'

describe('POST /api/staff/admissions/aptitude/sessions/[id]/void', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
  })

  describe('POST', () => {
    it('voids session and returns updated record', async () => {
      prismaMock.aptitudeTestSession.findUnique.mockResolvedValueOnce({ id: 'session-1', status: 'COMPLETED' } as any)
      prismaMock.aptitudeTestSession.update.mockResolvedValueOnce({ id: 'session-1', status: 'VOIDED', passed: false } as any)
      const req = new NextRequest('http://localhost/api/staff/admissions/aptitude/sessions/session-1/void', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await POST(req, { params: Promise.resolve({ id: 'session-1' }) })
      expect(res.status).toBe(200)
    })

    it('returns 404 when session not found', async () => {
      prismaMock.aptitudeTestSession.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/admissions/aptitude/sessions/nonexistent/void', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await POST(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      expect(res.status).toBe(404)
    })

    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/admissions/aptitude/sessions/session-1/void', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await POST(req, { params: Promise.resolve({ id: 'session-1' }) })
      expect(res.status).toBe(401)
    })
  })
})
