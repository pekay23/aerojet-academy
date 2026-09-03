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

import { GET } from '@/app/api/staff/courses/route'
import { requireStaff } from '@/lib/auth/helpers'
import { serializePrisma } from '@/lib/utils/serialization'

describe('GET /api/staff/courses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    prismaMock.course.findMany.mockResolvedValue([])
    prismaMock.course.count.mockResolvedValue(0)
  })

  it('returns paginated courses list', async () => {
    const courses = [
      {
        id: 'c1',
        code: 'ATPL-01',
        name: 'ATPL Ground School',
        _count: { enrollments: 10, classes: 2 },
      },
    ]
    prismaMock.course.findMany.mockResolvedValue(courses)
    prismaMock.course.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/staff/courses?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].code).toBe('ATPL-01')
    expect(json.meta.total).toBe(1)
  })

  it('returns empty list when no courses', async () => {
    prismaMock.course.findMany.mockResolvedValue([])
    prismaMock.course.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/staff/courses')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(0)
  })
})
