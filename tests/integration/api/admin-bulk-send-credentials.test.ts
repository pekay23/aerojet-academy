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

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {},
  queryAuditLogs: vi.fn(),
}))

vi.mock('@/lib/email/service', () => ({
  wrapEmail: vi.fn().mockReturnValue('<html>email</html>'),
  sendEmail: vi.fn().mockResolvedValue(undefined),
  sendBulkEmails: vi.fn().mockResolvedValue(undefined),
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
  })
}))

import { POST } from '@/app/api/admin/bulk-send-credentials/route.ts'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('POST /api/admin/bulk-send-credentials', () => {
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
      ;(requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/admin/bulk-send-credentials', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when users array is missing', async () => {
      const req = new NextRequest('http://localhost/api/admin/bulk-send-credentials', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 200 with summary on valid input', async () => {
      prismaMock.user.findMany.mockResolvedValueOnce([
        {
          id: 'user-1',
          email: 'user@test.com',
          academyEmail: 'user@aerojet-academy.com',
          personalEmail: 'user@gmail.com',
          profile: { firstName: 'John', lastName: 'Doe' },
          wallet: { currency: 'EUR', availableBalance: 100 },
          studentProfile: { studentId: 'STU-001' },
        } as any,
      ])
      prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1' } as any)
      const req = new NextRequest('http://localhost/api/admin/bulk-send-credentials', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ users: [{ userId: 'user-1' }] }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

  })

})
