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

import { PUT, DELETE } from '@/app/api/staff/semesters/[id]/route'
import { requireStaff } from '@/lib/auth/helpers'

describe('PUT/DELETE /api/staff/semesters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
  })

  describe('PUT', () => {
    it('returns 200 on valid update', async () => {
      prismaMock.semester.findUnique.mockResolvedValueOnce({
        id: 'sem-1',
        name: 'Spring',
        academicYear: {
          id: 'ay-1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
      } as any)
      prismaMock.semester.update.mockResolvedValueOnce({ id: 'sem-1', name: 'Updated' } as any)
      const req = new NextRequest('http://localhost/api/staff/semesters/1', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          name: 'Updated',
          startDate: '2024-01-15',
          endDate: '2024-05-30',
        }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: 'sem-1' }) })
      expect(res.status).toBe(200)
    })

    it('returns 404 when resource not found', async () => {
      prismaMock.semester.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/semesters/1', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          name: 'Updated',
          startDate: '2024-01-15',
          endDate: '2024-05-30',
        }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      expect(res.status).toBe(404)
    })

    it('returns 400 when required fields missing', async () => {
      const req = new NextRequest('http://localhost/api/staff/semesters/1', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ name: 'Updated' }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: 'sem-1' }) })
      expect(res.status).toBe(400)
    })

    it('returns 500 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/semesters/1', {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          name: 'Updated',
          startDate: '2024-01-15',
          endDate: '2024-05-30',
        }),
      })
      const res = await PUT(req, { params: Promise.resolve({ id: 'sem-1' }) })
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('returns 200 on successful delete', async () => {
      prismaMock.semester.findUnique.mockResolvedValueOnce({
        id: 'sem-1',
        name: 'Spring',
        _count: { classes: 0 },
      } as any)
      prismaMock.semester.delete.mockResolvedValueOnce({ id: 'sem-1' } as any)
      const req = new NextRequest('http://localhost/api/staff/semesters/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await DELETE(req, { params: Promise.resolve({ id: 'sem-1' }) })
      expect(res.status).toBe(200)
    })

    it('returns 404 when resource not found', async () => {
      prismaMock.semester.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/semesters/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      expect(res.status).toBe(404)
    })

    it('returns 400 when semester has classes', async () => {
      prismaMock.semester.findUnique.mockResolvedValueOnce({
        id: 'sem-1',
        name: 'Spring',
        _count: { classes: 3 },
      } as any)
      const req = new NextRequest('http://localhost/api/staff/semesters/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await DELETE(req, { params: Promise.resolve({ id: 'sem-1' }) })
      expect(res.status).toBe(400)
    })

    it('returns 500 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/semesters/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await DELETE(req, { params: Promise.resolve({ id: 'sem-1' }) })
      expect(res.status).toBe(500)
    })
  })
})
