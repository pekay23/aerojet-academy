import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStudent: vi.fn(),
  requireAuth: vi.fn(),
}))

import { GET } from '@/app/api/student/exams/route'
import { requireStudent } from '@/lib/auth/helpers'

const mockUser = {
  id: 'user-1',
  email: 'student@test.com',
  role: 'STUDENT',
  firstName: 'John',
  lastName: 'Doe',
}

const mockBookings = [
  {
    id: 'booking-1',
    userId: 'user-1',
    examId: 'exam-1',
    examComponentId: 'comp-1',
    bookedAt: '2024-11-01T00:00:00.000Z',
    status: 'COMPLETED',
    exam: {
      id: 'exam-1',
      examComponent: {
        id: 'comp-1',
        code: 'ATPL-NAV',
        name: 'Navigation',
        course: { code: 'ATPL-101', name: 'Airline Transport Pilot Theory' },
      },
    },
    examComponent: {
      id: 'comp-1',
      code: 'ATPL-NAV',
      name: 'Navigation',
      course: { code: 'ATPL-101', name: 'Airline Transport Pilot Theory' },
    },
  },
  {
    id: 'booking-2',
    userId: 'user-1',
    examId: 'exam-2',
    examComponentId: 'comp-2',
    bookedAt: '2024-10-15T00:00:00.000Z',
    status: 'BOOKED',
    exam: {
      id: 'exam-2',
      examComponent: {
        id: 'comp-2',
        code: 'CPL-MET',
        name: 'Meteorology',
        course: { code: 'CPL-201', name: 'CPL Ground School' },
      },
    },
    examComponent: {
      id: 'comp-2',
      code: 'CPL-MET',
      name: 'Meteorology',
      course: { code: 'CPL-201', name: 'CPL Ground School' },
    },
  },
]

describe('Student Exams — GET /api/student/exams', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(requireStudent).mockResolvedValue(mockUser as any)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireStudent).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/student/exams', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns paginated exam bookings with exam and component details', async () => {
    prismaMock.examBooking.findMany.mockResolvedValueOnce(mockBookings as any)
    prismaMock.examBooking.count.mockResolvedValueOnce(2)

    const req = new NextRequest('http://localhost/api/student/exams', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(2)
    expect(json.data[0]).toHaveProperty('status', 'COMPLETED')
    expect(json.data[0].exam.examComponent).toHaveProperty('name', 'Navigation')
    expect(json.data[0].exam.examComponent.course).toHaveProperty('code', 'ATPL-101')
    expect(json.data[1].examComponent).toHaveProperty('name', 'Meteorology')
    expect(json.data[1].examComponent.course).toHaveProperty('name', 'CPL Ground School')
    expect(json.meta).toHaveProperty('total', 2)
    expect(json.meta).toHaveProperty('page', 1)
  })

  it('returns empty list when student has no exam bookings', async () => {
    prismaMock.examBooking.findMany.mockResolvedValueOnce([])
    prismaMock.examBooking.count.mockResolvedValueOnce(0)

    const req = new NextRequest('http://localhost/api/student/exams', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(0)
    expect(json.meta.total).toBe(0)
    expect(json.meta.totalPages).toBe(0)
  })

  it('queries exam bookings filtered by authenticated user id', async () => {
    prismaMock.examBooking.findMany.mockResolvedValueOnce(mockBookings as any)
    prismaMock.examBooking.count.mockResolvedValueOnce(2)

    const req = new NextRequest('http://localhost/api/student/exams', { method: 'GET' })
    await GET(req)

    expect(prismaMock.examBooking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        include: expect.objectContaining({
          exam: expect.objectContaining({
            include: expect.objectContaining({
              examComponent: expect.any(Object),
            }),
          }),
          examComponent: expect.any(Object),
        }),
      })
    )
    expect(prismaMock.examBooking.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
  })

  it('orders bookings by bookedAt descending', async () => {
    prismaMock.examBooking.findMany.mockResolvedValueOnce(mockBookings as any)
    prismaMock.examBooking.count.mockResolvedValueOnce(2)

    const req = new NextRequest('http://localhost/api/student/exams', { method: 'GET' })
    await GET(req)

    expect(prismaMock.examBooking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { bookedAt: 'desc' } })
    )
  })

  it('respects pagination query params', async () => {
    prismaMock.examBooking.findMany.mockResolvedValueOnce([mockBookings[1]] as any)
    prismaMock.examBooking.count.mockResolvedValueOnce(2)

    const req = new NextRequest('http://localhost/api/student/exams?page=2&limit=1', {
      method: 'GET',
    })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.page).toBe(2)
    expect(json.meta.limit).toBe(1)

    expect(prismaMock.examBooking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 1, take: 1 })
    )
  })
})
