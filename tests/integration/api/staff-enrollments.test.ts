import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requireInstructor: vi.fn(),
  requireApplicant: vi.fn(),
  hashPassword: vi.fn(),
  generateToken: vi.fn(),
  generateTempPassword: vi.fn(),
  generateAcademyEmail: vi.fn(),
}))

import { GET } from '@/app/api/staff/enrollments/route'
import { requireStaff } from '@/lib/auth/helpers'

describe('GET /api/staff/enrollments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    prismaMock.enrollment.findMany.mockResolvedValue([])
    prismaMock.enrollment.count.mockResolvedValue(0)
  })

  it('returns paginated enrollments list', async () => {
    const enrollments = [
      {
        id: 'e1',
        status: 'ENROLLED',
        course: { code: 'ATPL-01', name: 'ATPL Ground' },
        user: {
          profile: { firstName: 'Alice', lastName: 'Smith' },
          studentProfile: { studentId: 'STU-001' },
        },
      },
    ]
    prismaMock.enrollment.findMany.mockResolvedValue(enrollments)
    prismaMock.enrollment.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/staff/enrollments?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].course.code).toBe('ATPL-01')
    expect(json.meta.total).toBe(1)
  })

  it('returns empty list when no enrollments', async () => {
    prismaMock.enrollment.findMany.mockResolvedValue([])
    prismaMock.enrollment.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/staff/enrollments')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(0)
  })
})
