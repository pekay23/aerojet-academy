import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } }),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
  requireInstructor: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requirePermission: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  verifyPassword: vi.fn().mockResolvedValue(true),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
  generateStudentId: vi.fn().mockReturnValue('STU-001'),
}))

import { GET, PUT } from '@/app/api/staff/classes/[id]/seating/route.ts'
import { getAuthSession } from '@/lib/auth/helpers'

describe('/staff/classes/:id/seating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } })
    prismaMock.systemSetting.findUnique.mockResolvedValue(null as any)
    prismaMock.class.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(getAuthSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/classes/1/seating')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 200 with assignments when class exists', async () => {
    prismaMock.systemSetting.findUnique.mockResolvedValue({ key: 'class_seating_1', value: '{"1":"user-1"}' } as any)
    const req = new NextRequest('http://localhost/staff/classes/1/seating')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 401 on PUT when unauthenticated', async () => {
    ;(getAuthSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/classes/1/seating', {
      method: 'PUT',
      body: JSON.stringify({ assignments: {} }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 on PUT when class not found', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/classes/999/seating', {
      method: 'PUT',
      body: JSON.stringify({ assignments: {} }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: '999' }) })
    expect(res.status).toBe(404)
  })

  it('returns 200 on PUT when data is valid', async () => {
    prismaMock.class.findUnique.mockResolvedValue({ id: '1' } as any)
    prismaMock.systemSetting.upsert.mockResolvedValue({ key: 'class_seating_1', value: '{}' } as any)
    const req = new NextRequest('http://localhost/staff/classes/1/seating', {
      method: 'PUT',
      body: JSON.stringify({ assignments: { '1': 'user-1' } }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })
})
