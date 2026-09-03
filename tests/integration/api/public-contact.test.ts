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
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  verifyPassword: vi.fn(),
  generateStudentId: vi.fn(),
  checkRateLimit: vi.fn().mockReturnValue(true),
  requireStudent: vi.fn(),
  requireInstructor: vi.fn(),
  requireApplicant: vi.fn(),
  requireAdminOrStaff: vi.fn(),
  requireExaminer: vi.fn(),
  generateRegistrationCode: vi.fn(),
}))

vi.mock('@/lib/email/service', () => ({
  sendContactEnquiryConfirmation: vi.fn().mockResolvedValue(undefined),
  sendEmail: vi.fn().mockResolvedValue(undefined),
  sendBulkEmails: vi.fn().mockResolvedValue(undefined),
  wrapEmail: vi.fn().mockReturnValue('<html>email</html>'),
}))

vi.mock('@/lib/api/response', () => ({
  apiTooManyRequests: vi
    .fn()
    .mockReturnValue({ status: 429, json: () => Promise.resolve({ error: 'Too many requests' }) }),
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ message, error: message }),
  })),
  withErrorHandler: vi.fn((fn: any) => {
    return async (req: any, ctx?: any) => {
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

vi.mock('@/lib/constants/business-rules', () => ({
  EMAIL_ADDRESSES: {
    fromNoReply: 'noreply@mail.aerojet-academy.com',
    fromTransactional: 'admissions@mail.aerojet-academy.com',
  },
}))

import { POST } from '@/app/api/public/contact/route'
import { checkRateLimit } from '@/lib/auth/helpers'

describe('POST /api/public/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
  })

  describe('POST', () => {
    it('returns 429 when rate limited', async () => {
      ;(checkRateLimit as any).mockReturnValueOnce(false)
      const req = new NextRequest('http://localhost/api/public/contact', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          subject: 'Hi',
          message: 'Hello world here',
          captchaToken: 'token',
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(429)
    })

    it('returns 400 for invalid input', async () => {
      const req = new NextRequest('http://localhost/api/public/contact', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ invalid: 'data' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })
})
