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

import { GET } from '@/app/api/staff/users/search/route'
import { requireStaff } from '@/lib/auth/helpers'

describe('GET /api/staff/users/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    prismaMock.user.findMany.mockResolvedValue([])
  })

  it('returns matching users', async () => {
    const users = [
      { id: 'u1', email: 'alice@test.com', profile: { firstName: 'Alice', lastName: 'Smith' }, studentProfile: { studentId: 'STU-001' } },
    ]
    prismaMock.user.findMany.mockResolvedValue(users)

    const req = new NextRequest('http://localhost/api/staff/users/search?q=alice')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
  })

  it('returns empty array when no matches', async () => {
    prismaMock.user.findMany.mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/staff/users/search?q=nonexistent')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(0)
  })

  it('returns up to 20 users with empty query', async () => {
    const users = Array.from({ length: 20 }, (_, i) => ({
      id: `u${i}`,
      email: `user${i}@test.com`,
      profile: { firstName: `User${i}`, lastName: 'Test' },
      studentProfile: { studentId: `STU-${String(i).padStart(3, '0')}` },
    }))
    prismaMock.user.findMany.mockResolvedValue(users)

    const req = new NextRequest('http://localhost/api/staff/users/search')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(20)
  })
})
