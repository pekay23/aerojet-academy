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

import { GET } from '@/app/api/staff/users/route'
import { getAuthSession } from '@/lib/auth/helpers'

const staffSession = { user: { id: 'staff-1', role: 'ADMIN' } }

describe('GET /api/staff/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue(staffSession)
    prismaMock.user.findMany.mockResolvedValue([])
    prismaMock.user.count.mockResolvedValue(0)
  })

  it('returns 401 when not authenticated', async () => {
    ;(getAuthSession as any).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/staff/users')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns paginated users list', async () => {
    const users = [
      {
        id: 'u1',
        email: 'admin@test.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        profile: { firstName: 'Admin', lastName: 'User' },
      },
    ]
    prismaMock.user.findMany.mockResolvedValue(users)
    prismaMock.user.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/staff/users?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })

  it('returns empty list when no users', async () => {
    prismaMock.user.findMany.mockResolvedValue([])
    prismaMock.user.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/staff/users')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(0)
  })
})
