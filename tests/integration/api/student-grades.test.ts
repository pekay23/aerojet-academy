import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStudent: vi.fn(),
  requireAuth: vi.fn(),
}))

import { GET } from '@/app/api/student/grades/route'
import { requireStudent } from '@/lib/auth/helpers'

const mockUser = {
  id: 'user-1',
  email: 'student@test.com',
  role: 'STUDENT',
  firstName: 'John',
  lastName: 'Doe',
}

const mockGrades = [
  {
    id: 'grade-1',
    userId: 'user-1',
    enrollmentId: 'enroll-1',
    score: 85,
    gradeLetter: 'A',
    passed: true,
    createdAt: '2024-12-01T00:00:00.000Z',
    enrollment: {
      id: 'enroll-1',
      course: { code: 'ATPL-101', name: 'Airline Transport Pilot Theory' },
    },
  },
  {
    id: 'grade-2',
    userId: 'user-1',
    enrollmentId: 'enroll-2',
    score: 72,
    gradeLetter: 'B',
    passed: true,
    createdAt: '2024-11-20T00:00:00.000Z',
    enrollment: {
      id: 'enroll-2',
      course: { code: 'NAV-201', name: 'Advanced Navigation' },
    },
  },
  {
    id: 'grade-3',
    userId: 'user-1',
    enrollmentId: 'enroll-3',
    score: 45,
    gradeLetter: 'F',
    passed: false,
    createdAt: '2024-11-10T00:00:00.000Z',
    enrollment: {
      id: 'enroll-3',
      course: { code: 'MET-301', name: 'Meteorology' },
    },
  },
]

describe('Student Grades — GET /api/student/grades', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(requireStudent).mockResolvedValue(mockUser as any)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireStudent).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/student/grades', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns paginated grades with enrollment and course details', async () => {
    prismaMock.grade.findMany.mockResolvedValueOnce(mockGrades as any)
    prismaMock.grade.count.mockResolvedValueOnce(3)

    const req = new NextRequest('http://localhost/api/student/grades', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(3)
    expect(json.data[0]).toHaveProperty('score', 85)
    expect(json.data[0]).toHaveProperty('gradeLetter', 'A')
    expect(json.data[0]).toHaveProperty('passed', true)
    expect(json.data[0].enrollment.course).toHaveProperty('code', 'ATPL-101')
    expect(json.data[0].enrollment.course).toHaveProperty('name', 'Airline Transport Pilot Theory')
    expect(json.data[2]).toHaveProperty('gradeLetter', 'F')
    expect(json.data[2]).toHaveProperty('passed', false)
    expect(json.data[2].enrollment.course).toHaveProperty('name', 'Meteorology')
    expect(json.meta).toHaveProperty('total', 3)
    expect(json.meta).toHaveProperty('page', 1)
    expect(json.meta).toHaveProperty('totalPages', 1)
  })

  it('returns empty list when student has no grades', async () => {
    prismaMock.grade.findMany.mockResolvedValueOnce([])
    prismaMock.grade.count.mockResolvedValueOnce(0)

    const req = new NextRequest('http://localhost/api/student/grades', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(0)
    expect(json.meta.total).toBe(0)
    expect(json.meta.totalPages).toBe(0)
  })

  it('queries grades filtered by authenticated user id', async () => {
    prismaMock.grade.findMany.mockResolvedValueOnce(mockGrades as any)
    prismaMock.grade.count.mockResolvedValueOnce(3)

    const req = new NextRequest('http://localhost/api/student/grades', { method: 'GET' })
    await GET(req)

    expect(prismaMock.grade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        include: expect.objectContaining({
          enrollment: expect.objectContaining({
            include: expect.objectContaining({
              course: expect.any(Object),
            }),
          }),
        }),
      })
    )
    expect(prismaMock.grade.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
  })

  it('orders grades by createdAt descending', async () => {
    prismaMock.grade.findMany.mockResolvedValueOnce(mockGrades as any)
    prismaMock.grade.count.mockResolvedValueOnce(3)

    const req = new NextRequest('http://localhost/api/student/grades', { method: 'GET' })
    await GET(req)

    expect(prismaMock.grade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    )
  })

  it('respects pagination query params', async () => {
    prismaMock.grade.findMany.mockResolvedValueOnce([mockGrades[2]] as any)
    prismaMock.grade.count.mockResolvedValueOnce(3)

    const req = new NextRequest('http://localhost/api/student/grades?page=2&limit=2', {
      method: 'GET',
    })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.page).toBe(2)
    expect(json.meta.limit).toBe(2)
    expect(json.meta.totalPages).toBe(2)

    expect(prismaMock.grade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 2, take: 2 })
    )
  })
})
