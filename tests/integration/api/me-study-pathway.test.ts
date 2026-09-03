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

vi.mock('@/lib/enrollment/engine', () => ({
  triggerAutoEnrollmentIfRequired: vi.fn().mockReturnValue({ success: true }),
}))

import { POST } from '@/app/api/me/study-pathway/route'
import { getAuthSession } from '@/lib/auth/helpers'

describe('POST /api/me/study-pathway', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'user-1', role: 'STUDENT' } })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/me/study-pathway', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('returns 403 when user role is not APPLICANT or STUDENT', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'ADMIN' } })
      const req = new NextRequest('http://localhost/api/me/study-pathway', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })

    it('returns 400 for invalid study pathway', async () => {
      prismaMock.studyPathwayModel.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/me/study-pathway', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ studyPathway: 'INVALID' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })
})
