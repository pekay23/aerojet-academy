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
  getInstructorProfileByUserId: vi.fn().mockResolvedValue({ id: 'instructor-1' }),
  getInstructorProfileIdOrThrow: vi.fn().mockResolvedValue('instructor-1'),
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/instructor/dashboard/route'
import { requireInstructor } from '@/lib/auth/helpers'

describe('/instructor/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireInstructor as any).mockResolvedValue({ id: 'user-1', role: 'INSTRUCTOR' })
    ;(requireInstructor as any).mockRejectedValueOnce(new Error('Unauthorized'))
    prismaMock.instructorProfile.findUnique.mockResolvedValue({ id: 'instructor-1' } as any)
  })

  it('returns 401 when unauthenticated', async () => {
    const req = new NextRequest('http://localhost/instructor/dashboard')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with data', async () => {
    prismaMock.class.findMany.mockResolvedValueOnce([] as any)
    prismaMock.class.findMany.mockResolvedValueOnce([] as any)
    prismaMock.attendanceRecord.findMany.mockResolvedValueOnce([] as any)
    prismaMock.attendanceRecord.findMany.mockResolvedValueOnce([] as any)
    const req = new NextRequest('http://localhost/instructor/dashboard')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success ?? json.data).toBeDefined()
  })
})
