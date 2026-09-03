vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi
    .fn()
    .mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } }),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
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
vi.mock('@/lib/prisma/soft-delete', () => ({
  softDeleteData: vi.fn().mockReturnValue({ success: true }),
}))
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: any) => fn),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { PATCH, DELETE } from '@/app/api/staff/courses/[id]/exam-components/[componentId]/route'
import { requireStaff } from '@/lib/auth/helpers'

describe('/staff/courses/:id/exam-components/:componentId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
    prismaMock.notification.create.mockResolvedValue({} as any)
    prismaMock.examComponent.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated (PATCH)', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/courses/1/exam-components/comp-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: '1', componentId: 'comp-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when component not found (PATCH)', async () => {
    prismaMock.examComponent.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/courses/1/exam-components/comp-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: '1', componentId: 'comp-1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 401 when unauthenticated (DELETE)', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/courses/1/exam-components/comp-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: '1', componentId: 'comp-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when component not found (DELETE)', async () => {
    prismaMock.examComponent.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/courses/1/exam-components/comp-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: '1', componentId: 'comp-1' }) })
    expect(res.status).toBe(404)
  })
})
