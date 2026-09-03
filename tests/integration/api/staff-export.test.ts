import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

vi.mock('@/lib/auth/auth-options', () => ({
  authOptions: {},
  getAuthSession: vi.fn(),
}))

import { GET } from '@/app/api/staff/export/route'

const adminSession = { user: { id: 'staff-1', role: 'ADMIN' } }

describe('GET /api/staff/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(getServerSession as any).mockResolvedValue(adminSession)
  })

  it('exports students as CSV (200)', async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([
      {
        id: '1',
        email: 'a@b.com',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        profile: null,
        studentProfile: null,
        academyEmail: null,
        programmeChoice: null,
      },
    ] as any)
    const req = new NextRequest('http://localhost/api/staff/export?type=students')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toContain('ID,Name,Email')
  })

  it('returns 400 for an invalid export type', async () => {
    const req = new NextRequest('http://localhost/api/staff/export?type=invalid')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 403 when unauthenticated', async () => {
    ;(getServerSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/staff/export?type=students')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })
})
