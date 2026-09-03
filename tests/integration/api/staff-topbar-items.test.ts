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

import { GET } from '@/app/api/staff/topbar-items/route'
import { getAuthSession } from '@/lib/auth/helpers'

describe('GET /api/staff/topbar-items', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns topbar data for staff', async () => {
      prismaMock.notification.findMany.mockResolvedValueOnce([
        { id: 'n1', title: 'Test', message: 'Test msg', type: 'INFO', isRead: false, createdAt: new Date(), linkUrl: null },
      ] as any)
      prismaMock.message.findMany.mockResolvedValueOnce([
        {
          id: 'm1',
          subject: 'Test',
          body: 'Test body',
          isRead: false,
          createdAt: new Date(),
          sender: { email: 'sender@test.com', profile: { firstName: 'John', lastName: 'Doe' } },
        },
      ] as any)
      prismaMock.user.findMany.mockResolvedValueOnce([
        { id: 'u1', email: 'applicant@test.com', createdAt: new Date(), profile: { firstName: 'Jane', lastName: 'Doe' } },
      ] as any)
      prismaMock.payment.findMany.mockResolvedValueOnce([
        {
          id: 'p1',
          amount: 100,
          currency: 'USD',
          createdAt: new Date(),
          user: { email: 'student@test.com', profile: { firstName: 'Bob', lastName: 'Smith' } },
        },
      ] as any)
      prismaMock.enrollment.findMany.mockResolvedValueOnce([
        {
          id: 'e1',
          createdAt: new Date(),
          user: { email: 'student@test.com', profile: { firstName: 'Bob', lastName: 'Smith' } },
          course: { name: 'ATPL', code: 'ATPL101' },
        },
      ] as any)
      const req = new NextRequest('http://localhost/api/staff/topbar-items', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.notifications).toBeDefined()
      expect(json.messages).toBeDefined()
      expect(json.pendingItems).toBeDefined()
    })

    it('returns empty data when no results', async () => {
      prismaMock.notification.findMany.mockResolvedValueOnce([])
      prismaMock.message.findMany.mockResolvedValueOnce([])
      prismaMock.user.findMany.mockResolvedValueOnce([])
      prismaMock.payment.findMany.mockResolvedValueOnce([])
      prismaMock.enrollment.findMany.mockResolvedValueOnce([])
      const req = new NextRequest('http://localhost/api/staff/topbar-items', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns 401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/topbar-items', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET()
      expect(res.status).toBe(401)
    })

    it('returns 401 when user is not staff role', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce({ user: { id: 'student-1', role: 'STUDENT' } })
      const req = new NextRequest('http://localhost/api/staff/topbar-items', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET()
      expect(res.status).toBe(401)
    })
  })
})
