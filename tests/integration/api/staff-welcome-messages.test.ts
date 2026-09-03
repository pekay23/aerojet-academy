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

import { POST } from '@/app/api/staff/welcome-messages/route'
import { getAuthSession } from '@/lib/auth/helpers'

describe('POST /api/staff/welcome-messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('POST', () => {
    it('returns 200 on valid input', async () => {
      prismaMock.systemSetting.upsert.mockResolvedValueOnce({ id: '1' } as any)
      const req = new NextRequest('http://localhost/api/staff/welcome-messages', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          messages: {
            STUDENT: ['Welcome student!', 'Hello!'],
            STAFF: ['Welcome staff!'],
          },
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns 400 for invalid payload', async () => {
      const req = new NextRequest('http://localhost/api/staff/welcome-messages', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ invalid: 'data' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 when no valid message arrays', async () => {
      const req = new NextRequest('http://localhost/api/staff/welcome-messages', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ messages: { STUDENT: 'not-an-array' } }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/welcome-messages', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          messages: { STUDENT: ['Welcome!'] },
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('returns 401 when user is not staff role', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce({ user: { id: 'student-1', role: 'STUDENT' } })
      const req = new NextRequest('http://localhost/api/staff/welcome-messages', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          messages: { STUDENT: ['Welcome!'] },
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })
  })
})
