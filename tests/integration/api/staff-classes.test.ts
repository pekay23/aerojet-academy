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

import { GET } from '@/app/api/staff/classes/route'
import { requireStaff } from '@/lib/auth/helpers'

describe('GET /api/staff/classes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    prismaMock.class.findMany.mockResolvedValue([])
    prismaMock.class.count.mockResolvedValue(0)
  })

  it('returns paginated classes list', async () => {
    const classes = [
      {
        id: 'c1',
        name: 'Class A',
        course: { code: 'ATPL-01', name: 'ATPL Ground' },
        instructor: { user: { profile: { firstName: 'John', lastName: 'Doe' } } },
        _count: { attendanceRecords: 5 },
      },
    ]
    prismaMock.class.findMany.mockResolvedValue(classes)
    prismaMock.class.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/staff/classes?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })

  it('returns empty list when no classes', async () => {
    prismaMock.class.findMany.mockResolvedValue([])
    prismaMock.class.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/staff/classes')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(0)
  })
})
