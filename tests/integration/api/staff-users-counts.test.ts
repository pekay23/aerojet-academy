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

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: any) => fn),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

import { GET } from '@/app/api/staff/users/counts/route'
import { getAuthSession } from '@/lib/auth/helpers'

const staffSession = { user: { id: 'staff-1', role: 'ADMIN' } }

describe('GET /api/staff/users/counts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue(staffSession)
    prismaMock.$queryRaw.mockResolvedValue([{
      total: 10,
      applicantAll: 3,
      applicantPendingPayment: 1,
      applicantPendingApproval: 2,
      studentAll: 5,
      studentActive: 4,
      studentSuspended: 0,
      studentArchived: 1,
      examinerAll: 2,
    }])
  })

  it('returns 401 when not authenticated', async () => {
    ;(getAuthSession as any).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/staff/users/counts')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns user counts', async () => {
    const req = new NextRequest('http://localhost/api/staff/users/counts')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.total).toBe(10)
    expect(json.data.studentAll).toBe(5)
    expect(json.data.applicantAll).toBe(3)
  })

  it('returns zero counts on empty result', async () => {
    prismaMock.$queryRaw.mockResolvedValue([null])
    const req = new NextRequest('http://localhost/api/staff/users/counts')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.total).toBe(0)
  })
})
