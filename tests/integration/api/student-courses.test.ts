import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStudent: vi.fn(),
  requireAuth: vi.fn(),
}))

import { GET } from '@/app/api/student/courses/route'
import { requireStudent } from '@/lib/auth/helpers'

const mockUser = {
  id: 'user-1',
  email: 'student@test.com',
  role: 'STUDENT',
  firstName: 'John',
  lastName: 'Doe',
}

const mockEnrollments = [
  {
    id: 'enroll-1',
    userId: 'user-1',
    courseId: 'course-1',
    status: 'ACTIVE',
    createdAt: '2024-09-01T00:00:00.000Z',
    course: {
      id: 'course-1',
      code: 'ATPL-101',
      name: 'Airline Transport Pilot Theory',
      credits: 6,
      level: 'ATPL',
    },
    grades: [
      {
        id: 'grade-1',
        score: 85,
        gradeLetter: 'A',
        passed: true,
        createdAt: '2024-10-15T00:00:00.000Z',
      },
    ],
  },
  {
    id: 'enroll-2',
    userId: 'user-1',
    courseId: 'course-2',
    status: 'ACTIVE',
    createdAt: '2024-09-01T00:00:00.000Z',
    course: {
      id: 'course-2',
      code: 'NAV-201',
      name: 'Advanced Navigation',
      credits: 4,
      level: 'CPL',
    },
    grades: [],
  },
]

describe('Student Courses — GET /api/student/courses', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(requireStudent).mockResolvedValue(mockUser as any)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireStudent).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/student/courses', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns paginated enrolled courses with course details', async () => {
    prismaMock.enrollment.findMany.mockResolvedValueOnce(mockEnrollments as any)
    prismaMock.enrollment.count.mockResolvedValueOnce(2)

    const req = new NextRequest('http://localhost/api/student/courses', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(2)
    expect(json.data[0]).toHaveProperty('status', 'ACTIVE')
    expect(json.data[0].course).toHaveProperty('code', 'ATPL-101')
    expect(json.data[0].course).toHaveProperty('name', 'Airline Transport Pilot Theory')
    expect(json.data[1].course).toHaveProperty('code', 'NAV-201')
    expect(json.meta).toHaveProperty('total', 2)
    expect(json.meta).toHaveProperty('page', 1)
    expect(json.meta).toHaveProperty('limit', 20)
    expect(json.meta).toHaveProperty('totalPages', 1)
  })

  it('returns empty list when student has no enrollments', async () => {
    prismaMock.enrollment.findMany.mockResolvedValueOnce([])
    prismaMock.enrollment.count.mockResolvedValueOnce(0)

    const req = new NextRequest('http://localhost/api/student/courses', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(0)
    expect(json.meta.total).toBe(0)
    expect(json.meta.totalPages).toBe(0)
  })

  it('queries enrollments filtered by authenticated user id', async () => {
    prismaMock.enrollment.findMany.mockResolvedValueOnce(mockEnrollments as any)
    prismaMock.enrollment.count.mockResolvedValueOnce(2)

    const req = new NextRequest('http://localhost/api/student/courses', { method: 'GET' })
    await GET(req)

    expect(prismaMock.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        include: expect.objectContaining({
          course: true,
          grades: expect.any(Object),
        }),
      })
    )
    expect(prismaMock.enrollment.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
  })

  it('respects pagination query params', async () => {
    prismaMock.enrollment.findMany.mockResolvedValueOnce([mockEnrollments[1]] as any)
    prismaMock.enrollment.count.mockResolvedValueOnce(2)

    const req = new NextRequest('http://localhost/api/student/courses?page=2&limit=1', {
      method: 'GET',
    })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.page).toBe(2)
    expect(json.meta.limit).toBe(1)
    expect(json.meta.totalPages).toBe(2)

    expect(prismaMock.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 1, take: 1 })
    )
  })

  it('includes grades for each enrollment', async () => {
    prismaMock.enrollment.findMany.mockResolvedValueOnce(mockEnrollments as any)
    prismaMock.enrollment.count.mockResolvedValueOnce(2)

    const req = new NextRequest('http://localhost/api/student/courses', { method: 'GET' })
    const res = await GET(req)
    const json = await res.json()

    expect(json.data[0].grades).toHaveLength(1)
    expect(json.data[0].grades[0]).toHaveProperty('score', 85)
    expect(json.data[0].grades[0]).toHaveProperty('gradeLetter', 'A')
    expect(json.data[0].grades[0]).toHaveProperty('passed', true)
    expect(json.data[1].grades).toHaveLength(0)
  })
})
