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
  logAuditEvent: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE', PAYMENT_APPROVE: 'PAYMENT_APPROVE', ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE' },
}))

vi.mock('@/lib/validation/schemas', () => ({
  createClassSchema: vi.fn(),
  updateClassSchema: vi.fn(),
  validateBody: vi.fn().mockReturnValue({ success: true }),
}))

vi.mock('@/lib/scheduling/conflicts', () => ({
  findConflicts: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message, status) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
  apiNotFound: vi.fn((message) => ({ status: 404, json: () => Promise.resolve({ message, error: message }) })),
  apiCreated: vi.fn((data) => ({ status: 201, json: () => Promise.resolve(data) })),
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

import { GET, PATCH } from '@/app/api/staff/classes/[id]/route.ts'
import { requireStaff } from '@/lib/auth/helpers'

describe('/staff/classes/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
    prismaMock.class.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/classes/1')
    const res = await GET(req, { params: { id: '1' } })
    expect([401, 403]).toContain(res.status)
  })

  it('returns 200 with data when class exists', async () => {
    prismaMock.class.findUnique.mockResolvedValue({ id: '1', status: 'ACTIVE', course: { id: '1', code: 'C1', name: 'Course 1' }, instructor: { user: { profile: { firstName: 'John', lastName: 'Doe' } } }, _count: { attendanceRecords: 0 } } as any)
    const req = new NextRequest('http://localhost/staff/classes/1')
    const res = await GET(req, { params: { id: '1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 404 when class not found', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/classes/999')
    const res = await GET(req, { params: { id: '999' } })
    expect(res.status).toBe(404)
  })

  it('returns 401 on PATCH when unauthenticated', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/classes/1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, { params: { id: '1' } })
    expect([401, 403]).toContain(res.status)
  })

  it('returns 200 on PATCH when class exists', async () => {
    prismaMock.class.findUnique.mockResolvedValue({ id: '1', status: 'ACTIVE' } as any)
    prismaMock.class.update.mockResolvedValue({ id: '1', status: 'ACTIVE' } as any)
    const req = new NextRequest('http://localhost/staff/classes/1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: { id: '1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })
})
