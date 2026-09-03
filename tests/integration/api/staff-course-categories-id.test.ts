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

import { PATCH, DELETE } from '@/app/api/staff/course-categories/[id]/route'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('PATCH/DELETE /api/staff/course-categories/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('PATCH', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/course-categories/1', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) })
      expect([401, 403]).toContain(res.status)
    })

    it('returns 200 with updated category', async () => {
      prismaMock.courseCategory.findFirst.mockResolvedValueOnce(null)
      prismaMock.courseCategory.update.mockResolvedValueOnce({ id: '1', name: 'UPDATED' } as any)
      const req = new NextRequest('http://localhost/api/staff/course-categories/1', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ name: 'Updated' }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(200)
    })
  })

  describe('DELETE', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/course-categories/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) })
      expect([401, 403]).toContain(res.status)
    })

    it('returns 200 when category deleted', async () => {
      prismaMock.courseCategory.count.mockResolvedValueOnce(0)
      const req = new NextRequest('http://localhost/api/staff/course-categories/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(200)
    })
  })
})
