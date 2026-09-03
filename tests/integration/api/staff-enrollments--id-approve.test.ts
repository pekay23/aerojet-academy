import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi.fn(),
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

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  PERMISSIONS: { MANAGE_ENROLLMENTS: 'MANAGE_ENROLLMENTS' },
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

import { POST } from '@/app/api/staff/enrollments/[id]/approve/route'
import { requirePermission } from '@/lib/auth/permissions'

describe('/staff/enrollments/:id/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(requirePermission as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requirePermission as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/staff/enrollments/1/approve', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 403 when permission denied', async () => {
    ;(requirePermission as any).mockRejectedValueOnce(new Error('Forbidden'))
    const req = new NextRequest('http://localhost/api/staff/enrollments/1/approve', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(403)
  })

  it('returns 400 when enrollment ID is missing', async () => {
    const req = new NextRequest('http://localhost/api/staff/enrollments/approve', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({}) })
    expect(res.status).toBe(400)
  })

  it('returns 404 when enrollment not found', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/api/staff/enrollments/1/approve', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })

  it('returns 400 when enrollment is not PENDING', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValueOnce({
      id: 'e1',
      status: 'ENROLLED',
      user: {
        id: 'u1',
        role: 'STUDENT',
        profile: { firstName: 'John', lastName: 'Doe' },
        studentProfile: null,
      },
      course: { id: 'c1', code: 'ATPL101' },
    } as any)
    const req = new NextRequest('http://localhost/api/staff/enrollments/1/approve', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'e1' }) })
    expect(res.status).toBe(400)
  })

  it('returns 200 on successful approval', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValueOnce({
      id: 'e1',
      status: 'PENDING',
      user: {
        id: 'u1',
        role: 'STUDENT',
        profile: { firstName: 'John', lastName: 'Doe' },
        studentProfile: { id: 'sp1' },
      },
      course: { id: 'c1', code: 'ATPL101' },
    } as any)
    prismaMock.enrollment.update.mockResolvedValueOnce({ id: 'e1', status: 'ENROLLED' } as any)
    prismaMock.notification.create.mockResolvedValueOnce({ id: 'n1' } as any)
    const req = new NextRequest('http://localhost/api/staff/enrollments/1/approve', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'e1' }) })
    expect(res.status).toBe(200)
  })
})
