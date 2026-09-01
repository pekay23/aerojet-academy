vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiForbidden: vi.fn((message) => ({ status: 403, json: () => Promise.resolve({ message, error: message }) })),
  apiNotFound: vi.fn((message) => ({ status: 404, json: () => Promise.resolve({ message, error: message }) })),
  apiError: vi.fn((message, status) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
  apiPaginated: vi.fn((data, total, page, limit) => ({ status: 200, json: () => Promise.resolve({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }) })),
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
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
}))

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'INSTRUCTOR' } }),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi.fn().mockResolvedValue({ id: 'user-1', role: 'INSTRUCTOR' }),
  requireInstructor: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requirePermission: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  verifyPassword: vi.fn().mockResolvedValue(true),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
  generateStudentId: vi.fn().mockReturnValue('STU-001'),
}))
vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  logAuditEvent: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE', PAYMENT_APPROVE: 'PAYMENT_APPROVE', ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE' },
}))
vi.mock('@/lib/email/service', () => ({
  sendPaymentApprovedEmail: vi.fn(),
  sendPaymentRejectedEmail: vi.fn(),
  sendStudentPromotionEmail: vi.fn(),
  sendActivationEmail: vi.fn(),
}))
vi.mock('@/lib/validation/schemas', () => ({ takeAttendanceSchema: vi.fn().mockResolvedValue({ success: true }), validateBody: vi.fn().mockResolvedValue({ success: true }) }))
vi.mock('@/lib/instructor/profile', () => ({ getInstructorProfileByUserId: vi.fn().mockResolvedValue({ id: '1', success: true }) }))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/instructor/classes/[id]/attendance/route.ts'
import { requireInstructor } from '@/lib/auth/helpers'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { parsePagination } from '@/lib/api/response'


describe('/instructor/classes/:id/attendance', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(requireInstructor as any).mockResolvedValue({ id: 'user-1', role: 'INSTRUCTOR' })
    ;(getInstructorProfileByUserId as any).mockResolvedValue({ id: '1', success: true })
    ;(parsePagination as any).mockReturnValue({ page: 1, limit: 20, skip: 0 })
    prismaMock.notification.create.mockResolvedValue({} as any)
    prismaMock.class.findUnique.mockResolvedValue(null as any)
    prismaMock.attendanceRecord.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireInstructor as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/instructor/classes/1/attendance')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 200 with data', async () => {
    prismaMock.class.findMany.mockResolvedValue([{ id: '1', course: {"id":"1"}, instructor: {"id":"1"} }] as any)
    prismaMock.attendanceRecord.findMany.mockResolvedValue([{ id: '1' }] as any)
    prismaMock.class.findUnique.mockResolvedValue({ id: '1', status: 'ACTIVE', instructorId: '1' } as any)
    prismaMock.attendanceRecord.findUnique.mockResolvedValue({ id: '1' } as any)
    prismaMock.class.count.mockResolvedValue(0)
    prismaMock.attendanceRecord.count.mockResolvedValue(0)
    prismaMock.class.groupBy.mockResolvedValue([{ status: 'PRESENT', _count: 1 }] as any)
    prismaMock.attendanceRecord.groupBy.mockResolvedValue([{ status: 'PRESENT', _count: 1 }] as any)
    prismaMock.class.aggregate.mockResolvedValue({ _count: 1 } as any)
    prismaMock.attendanceRecord.aggregate.mockResolvedValue({ _count: 1 } as any)
    const req = new NextRequest('http://localhost/instructor/classes/1/attendance?page=1&limit=20')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireInstructor as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/instructor/classes/1/attendance', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    ;(requireInstructor as any).mockResolvedValueOnce({ id: 'user-1', role: 'INSTRUCTOR' })
    prismaMock.class.findUnique.mockResolvedValueOnce({ id: '1', status: 'ACTIVE', instructorId: '1' } as any)
    const { validateBody } = await import('@/lib/validation/schemas')
    vi.mocked(validateBody).mockResolvedValueOnce({ success: false, error: 'Invalid input' })
    const req = new NextRequest('http://localhost/instructor/classes/1/attendance', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(400)
  })
})
