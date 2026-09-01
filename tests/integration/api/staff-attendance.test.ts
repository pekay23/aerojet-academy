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

import { GET } from '@/app/api/staff/attendance/route.ts'
import { POST } from '@/app/api/staff/attendance/route.ts'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('GET/POST /api/staff/attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => {
      if (typeof fn === 'function') {
        return fn(prismaMock)
      }
      return Promise.all(fn)
    })
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns attendance records for a class', async () => {
      prismaMock.attendanceRecord.findMany.mockResolvedValueOnce([])
      prismaMock.class.findUnique.mockResolvedValueOnce({ id: 'class-1', name: 'Test Class', courseId: 'course-1' })
      prismaMock.enrollment.findMany.mockResolvedValueOnce([])
      const req = new NextRequest('http://localhost/api/staff/attendance?classId=class-1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns empty records when no data', async () => {
      prismaMock.attendanceRecord.findMany.mockResolvedValueOnce([])
      prismaMock.class.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/attendance?classId=class-1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns 400 when classId is missing', async () => {
      const req = new NextRequest('http://localhost/api/staff/attendance', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(400)
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/attendance', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 for invalid input', async () => {
      const req = new NextRequest('http://localhost/api/staff/attendance', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ invalid: 'data' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('saves attendance records on valid input', async () => {
      prismaMock.classSession.findMany.mockResolvedValueOnce([])
      prismaMock.attendanceRecord.upsert.mockResolvedValue({ id: 'rec-1' })
      prismaMock.class.findUnique.mockResolvedValueOnce({ id: 'class-1', name: 'Test Class', courseId: 'course-1' })
      prismaMock.enrollment.findMany.mockResolvedValueOnce([])
      const req = new NextRequest('http://localhost/api/staff/attendance', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          classId: 'class-1',
          date: '2026-01-15',
          records: [{ userId: 'user-1', status: 'PRESENT', minutesLate: 0, notes: '' }],
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })
  })
})
