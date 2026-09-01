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
  AuditAction: {},
  queryAuditLogs: vi.fn(),
}))

vi.mock('@/lib/compliance/reports', () => ({
  generatePoolRosterCSV: vi.fn().mockResolvedValue('id,name\n1,Test'),
}))

import { GET } from '@/app/api/staff/reports/roster/[poolId]/route.ts'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('GET /api/staff/reports/roster/[poolId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns roster CSV for valid poolId', async () => {
      prismaMock.examPool.findUnique.mockResolvedValueOnce({ id: 'pool-1', name: 'Test Pool' } as any)
      const req = new NextRequest('http://localhost/api/staff/reports/roster/pool-1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ poolId: 'pool-1' }) })
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('text/csv')
      const text = await res.text()
      expect(text).toBeDefined()
    })

    it('returns 401 for unauthorized', async () => {
      ;(getAuthSession as any).mockResolvedValue(null)
      const req = new NextRequest('http://localhost/api/staff/reports/roster/pool-1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ poolId: 'pool-1' }) })
      expect(res.status).toBe(401)
    })

    it('returns 400 for missing poolId', async () => {
      const req = new NextRequest('http://localhost/api/staff/reports/roster/', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ poolId: '' }) })
      expect(res.status).toBe(400)
    })
  })
})
