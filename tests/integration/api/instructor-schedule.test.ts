import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireInstructor: vi.fn(),
  verifyPassword: vi.fn().mockResolvedValue(true),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
}))

vi.mock('@/lib/instructor/profile', () => ({
  getInstructorProfileByUserId: vi.fn(),
}))

import { GET } from '@/app/api/instructor/schedule/route'
import { requireInstructor } from '@/lib/auth/helpers'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'

const mockUser = { id: 'user-1', role: 'INSTRUCTOR' }
const mockInstructorProfile = { id: 'instructor-1', userId: 'user-1' }
const mockClasses = [
  {
    id: 'class-1',
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: '2026-12-01T00:00:00.000Z',
    course: { code: 'CS101', name: 'Intro to CS', category: 'TECH' },
  },
  {
    id: 'class-2',
    startDate: '2026-10-01T00:00:00.000Z',
    endDate: '2026-11-01T00:00:00.000Z',
    course: { code: 'CS201', name: 'Advanced CS', category: 'TECH' },
  },
]

describe('Instructor Schedule — GET /api/instructor/schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireInstructor.mockResolvedValue(mockUser)
    getInstructorProfileByUserId.mockResolvedValue(mockInstructorProfile)
  })

  it('returns 401 when unauthenticated', async () => {
    requireInstructor.mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/instructor/schedule', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when instructor profile is missing', async () => {
    vi.mocked(getInstructorProfileByUserId).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/instructor/schedule', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns paginated schedule without date filters', async () => {
    prismaMock.class.findMany.mockResolvedValueOnce(mockClasses as any)
    prismaMock.class.count.mockResolvedValueOnce(2)

    const req = new NextRequest('http://localhost/api/instructor/schedule?page=1&limit=20', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(2)
    expect(json.data[0].course.code).toBe('CS101')
    expect(json.meta.total).toBe(2)
  })

  it('applies date range filter when start and end provided', async () => {
    prismaMock.class.findMany.mockResolvedValueOnce([mockClasses[1]] as any)
    prismaMock.class.count.mockResolvedValueOnce(1)

    const req = new NextRequest('http://localhost/api/instructor/schedule?start=2026-10-01&end=2026-10-31', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].id).toBe('class-2')

    expect(prismaMock.class.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          instructorId: 'instructor-1',
          startDate: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    )
  })

  it('returns empty array when no classes match', async () => {
    prismaMock.class.findMany.mockResolvedValueOnce([])
    prismaMock.class.count.mockResolvedValueOnce(0)

    const req = new NextRequest('http://localhost/api/instructor/schedule?page=1&limit=20', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(0)
    expect(json.meta.total).toBe(0)
  })
})
