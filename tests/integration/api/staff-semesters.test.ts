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

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: any) => fn),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

import { POST } from '@/app/api/staff/semesters/route'
import { requireStaff } from '@/lib/auth/helpers'

describe('POST /api/staff/semesters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
  })

  describe('POST', () => {
    it('returns 201 on valid input', async () => {
      prismaMock.academicYear.findUnique.mockResolvedValueOnce({
        id: 'ay-1',
        name: '2024-2025',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      } as any)
      prismaMock.semester.create.mockResolvedValueOnce({ id: 'sem-1', name: 'Spring' } as any)
      const req = new NextRequest('http://localhost/api/staff/semesters', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          name: 'Spring 2024',
          academicYearId: 'ay-1',
          startDate: '2024-01-15',
          endDate: '2024-05-30',
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns 400 when required fields missing', async () => {
      const req = new NextRequest('http://localhost/api/staff/semesters', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ name: 'Spring' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 500 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/semesters', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(500)
    })
  })
})
