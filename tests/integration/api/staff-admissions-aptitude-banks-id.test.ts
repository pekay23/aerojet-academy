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
  })
}))

import { GET } from '@/app/api/staff/admissions/aptitude/banks/[id]/route.ts'
import { PUT } from '@/app/api/staff/admissions/aptitude/banks/[id]/route.ts'
import { DELETE } from '@/app/api/staff/admissions/aptitude/banks/[id]/route.ts'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('GET/PUT/DELETE /api/staff/admissions/aptitude/banks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns bank by id', async () => {
      prismaMock.aptitudeTestBank.findUnique.mockResolvedValueOnce({ id: '1' } as any)
      const req = new NextRequest('http://localhost/api/staff/admissions/aptitude/banks/1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns 404 when not found', async () => {
      prismaMock.aptitudeTestBank.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/admissions/aptitude/banks/1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(404)
    })

  })

  describe('PUT', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/admissions/aptitude/banks/1', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(401)
    })

    it('returns 404 when resource not found', async () => {
      prismaMock.aptitudeTestBank.update.mockRejectedValueOnce({ code: 'P2025' } as any)
      const req = new NextRequest('http://localhost/api/staff/admissions/aptitude/banks/1', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ name: 'Updated' }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(404)
    })

  })

  describe('DELETE', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/admissions/aptitude/banks/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(401)
    })

    it('returns 404 when resource not found', async () => {
      prismaMock.aptitudeTestBank.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/admissions/aptitude/banks/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(404)
    })

  })

})
