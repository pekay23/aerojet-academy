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

vi.mock('@/lib/exams/resits', () => ({
  generateResitBackfillProposals: vi.fn().mockReturnValue({ success: true }),
  executeResitBackfill: vi.fn().mockReturnValue({ success: true, assignedCount: 0, skippedCount: 0 })
}))

import { GET, POST } from '@/app/api/staff/resit-backfill/route'
import { requireStaff } from '@/lib/auth/helpers'
import { generateResitBackfillProposals, executeResitBackfill } from '@/lib/exams/resits'

describe('GET/POST /api/staff/resit-backfill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
  })

  describe('GET', () => {
    it('returns 200 with eventId', async () => {
      ;(generateResitBackfillProposals as any).mockReturnValueOnce({ proposals: [] })
      const req = new NextRequest('http://localhost/api/staff/resit-backfill?eventId=evt-1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns 400 without eventId', async () => {
      const req = new NextRequest('http://localhost/api/staff/resit-backfill', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(400)
    })
  })

  describe('POST', () => {
    it('returns 200 with valid data', async () => {
      ;(executeResitBackfill as any).mockReturnValueOnce({ assignedCount: 1, skippedCount: 0 })
      const req = new NextRequest('http://localhost/api/staff/resit-backfill', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ eventId: 'evt-1', proposals: [{ id: '1' }] }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
    })

    it('returns 400 without eventId or proposals', async () => {
      const req = new NextRequest('http://localhost/api/staff/resit-backfill', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 500 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/resit-backfill', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ eventId: 'evt-1', proposals: [] }),
      })
      const res = await POST(req)
      expect(res.status).toBe(500)
    })
  })
})
