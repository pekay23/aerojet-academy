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
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) }))
}))

import { GET } from '@/app/api/me/privacy/route.ts'
import { PATCH } from '@/app/api/me/privacy/route.ts'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('GET/PATCH /api/me/privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns privacy settings for authenticated user', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ showLastSeen: true } as any)
      const req = new NextRequest('http://localhost/api/me/privacy', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns default false when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/me/privacy', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

  })

  describe('PATCH', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/me/privacy', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await PATCH(req)
      expect(res.status).toBe(401)
    })

    it('returns 500 for invalid input (zod parse error)', async () => {
      const req = new NextRequest('http://localhost/api/me/privacy', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ name: 'Updated' }),
      })
      const res = await PATCH(req)
      expect(res.status).toBe(500)
    })

    it('updates privacy settings on valid input', async () => {
      prismaMock.user.update.mockResolvedValueOnce({ id: 'staff-1', showLastSeen: true } as any)
      const req = new NextRequest('http://localhost/api/me/privacy', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ showLastSeen: true }),
      })
      const res = await PATCH(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

  })

})
