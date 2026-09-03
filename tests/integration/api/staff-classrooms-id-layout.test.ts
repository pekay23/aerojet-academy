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

import { PUT } from '@/app/api/staff/classrooms/[id]/layout/route'
import { GET } from '@/app/api/staff/classrooms/[id]/layout/route'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('PUT/GET /api/staff/classrooms/[id]/layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('PUT', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockResolvedValueOnce(null)
      ;(requireAdmin as any).mockResolvedValueOnce(null)
      ;(requireAuth as any).mockResolvedValueOnce(null)
      ;(getAuthSession as any).mockResolvedValueOnce({ user: { id: 'staff-1', role: 'STAFF' } })
      const req = new NextRequest('http://localhost/api/staff/classrooms/1/layout', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
      expect([401, 403]).toContain(res.status)
    })

    it('returns 404 when classroom not found', async () => {
      prismaMock.classroom.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/classrooms/1/layout', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ rows: 3, cols: 3, cells: [] }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(404)
    })

    it('returns 200 with updated layout', async () => {
      prismaMock.classroom.findUnique.mockResolvedValueOnce({ id: '1' } as any)
      prismaMock.classroom.findUnique.mockResolvedValueOnce({ id: '1', seats: [] } as any)
      const req = new NextRequest('http://localhost/api/staff/classrooms/1/layout', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ rows: 3, cols: 3, cells: [] }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })
  })

  describe('GET', () => {
    it('returns 200 with classroom layout', async () => {
      prismaMock.classroom.findUnique.mockResolvedValue({ id: '1', seats: [] } as any)
      const req = new NextRequest('http://localhost/api/staff/classrooms/1/layout', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns 404 when classroom not found', async () => {
      prismaMock.classroom.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/classrooms/999/layout', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ id: '999' }) })
      expect(res.status).toBe(404)
    })
  })
})
