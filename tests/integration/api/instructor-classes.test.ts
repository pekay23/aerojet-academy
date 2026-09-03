vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiForbidden: vi.fn((message) => ({
    status: 403,
    json: () => Promise.resolve({ message, error: message }),
  })),
  apiPaginated: vi.fn((data, total, page, limit) => ({
    status: 200,
    json: () =>
      Promise.resolve({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }),
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
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
}))

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi
    .fn()
    .mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'INSTRUCTOR' } }),
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
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    PAYMENT_APPROVE: 'PAYMENT_APPROVE',
    ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE',
  },
}))
vi.mock('@/lib/email/service', () => ({
  sendPaymentApprovedEmail: vi.fn(),
  sendPaymentRejectedEmail: vi.fn(),
  sendStudentPromotionEmail: vi.fn(),
  sendActivationEmail: vi.fn(),
}))
vi.mock('@/lib/instructor/profile', () => ({
  getInstructorProfileByUserId: vi.fn().mockResolvedValue({ id: '1', success: true }),
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/instructor/classes/route'
import { requireInstructor } from '@/lib/auth/helpers'

describe('/instructor/classes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireInstructor as any).mockResolvedValue({ id: 'user-1', role: 'INSTRUCTOR' })
    prismaMock.notification.create.mockResolvedValue({} as any)
    prismaMock.class.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireInstructor as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/instructor/classes')
    const res = await GET(req)
    expect([401, 403]).toContain(res.status)
  })

  it('returns 200 with data', async () => {
    prismaMock.class.findMany.mockResolvedValue([
      { id: '1', course: { id: '1' }, instructor: { id: '1' } },
    ] as any)
    prismaMock.class.findUnique.mockResolvedValue({ id: '1', status: 'ACTIVE' } as any)
    prismaMock.class.count.mockResolvedValue(0)
    prismaMock.class.groupBy.mockResolvedValue([{ status: 'PRESENT', _count: 1 }] as any)
    prismaMock.class.aggregate.mockResolvedValue({ _count: 1 } as any)
    const req = new NextRequest('http://localhost/instructor/classes?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })
})
