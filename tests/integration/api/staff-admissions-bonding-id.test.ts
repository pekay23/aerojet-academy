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

import { GET } from '@/app/api/staff/admissions/bonding/[id]/route.ts'
import { PUT } from '@/app/api/staff/admissions/bonding/[id]/route.ts'
import { requireStaff } from '@/lib/auth/helpers'

describe('GET/PUT /api/staff/admissions/bonding/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
  })

  describe('GET', () => {
    it('returns contract when found', async () => {
      prismaMock.bondingContract.findUnique.mockResolvedValueOnce({
        id: 'bonding-1',
        status: 'ISSUED',
        facilityName: 'Test Facility',
      } as any)
      const req = new NextRequest('http://localhost/api/staff/admissions/bonding/bonding-1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ id: 'bonding-1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns 404 when contract not found', async () => {
      prismaMock.bondingContract.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/admissions/bonding/nonexistent', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      expect(res.status).toBe(404)
    })

    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/admissions/bonding/bonding-1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ id: 'bonding-1' }) })
      expect(res.status).toBe(401)
    })
  })

  describe('PUT', () => {
    it('updates contract with valid data', async () => {
      prismaMock.bondingContract.findUnique.mockResolvedValueOnce({
        id: 'bonding-1',
        status: 'ISSUED',
        facilityName: 'Old Facility',
      } as any)
      prismaMock.bondingContract.update.mockResolvedValueOnce({
        id: 'bonding-1',
        status: 'SIGNED',
        facilityName: 'New Facility',
      } as any)
      const req = new NextRequest('http://localhost/api/staff/admissions/bonding/bonding-1', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ status: 'SIGNED', facilityName: 'New Facility' }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: 'bonding-1' }) })
      expect(res.status).toBe(200)
    })

    it('returns 404 when contract not found', async () => {
      prismaMock.bondingContract.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/admissions/bonding/nonexistent', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ status: 'SIGNED' }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      expect(res.status).toBe(404)
    })

    it('returns 400 for invalid status transition', async () => {
      prismaMock.bondingContract.findUnique.mockResolvedValueOnce({
        id: 'bonding-1',
        status: 'SIGNED',
        facilityName: 'Test Facility',
      } as any)
      const req = new NextRequest('http://localhost/api/staff/admissions/bonding/bonding-1', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ status: 'ISSUED' }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: 'bonding-1' }) })
      expect(res.status).toBe(400)
    })

    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/admissions/bonding/bonding-1', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ status: 'SIGNED' }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: 'bonding-1' }) })
      expect(res.status).toBe(401)
    })
  })
})
