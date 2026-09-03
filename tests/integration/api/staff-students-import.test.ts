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

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message: any, status?: number) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
  apiCreated: vi.fn((data: any) => ({ status: 201, json: () => Promise.resolve(data) })),
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

vi.mock('@/lib/wallet/operations', () => ({
  topUpWallet: vi.fn().mockReturnValue({ success: true }),
}))

vi.mock('@/lib/analytics/events', () => ({
  trackEnrollment: vi.fn().mockReturnValue({ success: true }),
}))

import { POST } from '@/app/api/staff/students/import/route'
import { requireStaff, hashPassword, generateAcademyEmail, generateStudentId } from '@/lib/auth/helpers'

describe('POST /api/staff/students/import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(hashPassword as any).mockResolvedValue('hashed-password')
    ;(generateAcademyEmail as any).mockResolvedValue('test@aerojet-academy.com')
    ;(generateStudentId as any).mockResolvedValue('STU-001')
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/students/import', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when students array is missing or empty', async () => {
      const req = new NextRequest('http://localhost/api/staff/students/import', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ students: [] }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 200 on successful import', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce(null)
      prismaMock.studyPathwayModel.findUnique.mockResolvedValueOnce(null)

      const mockUser = { id: 'user-1', email: 'test@aerojet-academy.com', personalEmail: 'student@test.com', academyEmail: 'test@aerojet-academy.com' }
      prismaMock.user.create.mockResolvedValueOnce(mockUser)
      prismaMock.profile.create.mockResolvedValueOnce(undefined)
      prismaMock.studentProfile.create.mockResolvedValueOnce(undefined)
      prismaMock.wallet.create.mockResolvedValueOnce(undefined)
      prismaMock.wallet.findUnique.mockResolvedValueOnce({ balance: { toNumber: () => 0 } })

      const req = new NextRequest('http://localhost/api/staff/students/import', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          students: [
            {
              email: 'student@test.com',
              firstName: 'John',
              lastName: 'Doe',
            },
          ],
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.summary).toBeDefined()
    })
  })
})
