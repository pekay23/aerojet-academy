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
vi.mock('@/lib/validation/schemas', () => ({ validateBody: vi.fn(), createCourseSchema: vi.fn() }))
vi.mock('@/lib/utils/serialization', () => ({
  serializePrisma: vi.fn().mockReturnValue({ success: true }),
}))
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: any) => fn),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/staff/courses/create/route'
import { requireStaff } from '@/lib/auth/helpers'
import { validateBody } from '@/lib/validation/schemas'

describe('/staff/courses/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
    prismaMock.notification.create.mockResolvedValue({} as any)
    prismaMock.course.findUnique.mockResolvedValue(null as any)
    ;(validateBody as any).mockReturnValue({
      success: true,
      data: { code: 'TEST', name: 'Test Course' },
    })
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/courses/create', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    ;(requireStaff as any).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
    prismaMock.course.findUnique.mockResolvedValueOnce(null as any)
    ;(validateBody as any).mockReturnValueOnce({ success: false, error: 'Invalid input' })
    const req = new NextRequest('http://localhost/staff/courses/create', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates resource on valid input', async () => {
    ;(requireStaff as any).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
    prismaMock.course.findUnique.mockResolvedValueOnce(null as any)
    prismaMock.course.create.mockResolvedValueOnce({ id: '1', code: 'TEST' } as any)
    const req = new NextRequest('http://localhost/staff/courses/create', {
      method: 'POST',
      body: JSON.stringify({ code: 'TEST', name: 'Test Course' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
