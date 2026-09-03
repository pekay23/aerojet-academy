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
  apiError: vi.fn((message: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ message, error: message }),
  })),
  apiNotFound: vi.fn((message) => ({
    status: 404,
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

import { POST } from '@/app/api/staff/admissions/documents/[id]/review/route'
import { requireStaff, getAuthSession } from '@/lib/auth/helpers'

describe('POST /api/staff/admissions/documents/[id]/review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/admissions/documents/doc-1/review', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      const res = await POST(req, { params: Promise.resolve({ id: 'doc-1' }) })
      expect(res.status).toBe(401)
    })

    it('returns 400 for invalid input', async () => {
      const req = new NextRequest('http://localhost/api/staff/admissions/documents/doc-1/review', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ invalid: 'data' }),
      })
      const res = await POST(req, { params: Promise.resolve({ id: 'doc-1' }) })
      expect(res.status).toBe(400)
    })

    it('approves document with valid input', async () => {
      prismaMock.applicationDocument.findUnique.mockResolvedValueOnce({
        id: 'doc-1',
        status: 'PENDING',
        application: { userId: 'user-1' },
      } as any)
      prismaMock.applicationDocument.update.mockResolvedValueOnce({
        id: 'doc-1',
        status: 'APPROVED',
        reviewedBy: 'staff-1',
      } as any)
      const req = new NextRequest('http://localhost/api/staff/admissions/documents/doc-1/review', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      const res = await POST(req, { params: Promise.resolve({ id: 'doc-1' }) })
      expect(res.status).toBe(200)
    })

    it('rejects document and creates notification', async () => {
      prismaMock.applicationDocument.findUnique.mockResolvedValueOnce({
        id: 'doc-1',
        status: 'PENDING',
        application: { userId: 'user-1' },
      } as any)
      prismaMock.applicationDocument.update.mockResolvedValueOnce({
        id: 'doc-1',
        status: 'REJECTED',
        rejectionReason: 'Not clear enough',
        documentType: { id: 'dt-1', name: 'Passport', slug: 'passport' },
      } as any)
      prismaMock.notification.create.mockResolvedValueOnce({ id: 'notif-1' } as any)
      const req = new NextRequest('http://localhost/api/staff/admissions/documents/doc-1/review', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: 'Not clear enough' }),
      })
      const res = await POST(req, { params: Promise.resolve({ id: 'doc-1' }) })
      expect(res.status).toBe(200)
    })

    it('returns 404 when document not found', async () => {
      prismaMock.applicationDocument.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/documents/nonexistent/review',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer test-secret' },
          body: JSON.stringify({ status: 'APPROVED' }),
        }
      )
      const res = await POST(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      expect(res.status).toBe(404)
    })
  })
})
