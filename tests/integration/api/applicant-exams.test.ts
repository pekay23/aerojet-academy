import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireApplicant: vi.fn(),
  verifyPassword: vi.fn().mockResolvedValue(true),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
}))

import { GET as GetPools } from '@/app/api/applicant/exam-only/pools/route'
import { GET as GetBookings } from '@/app/api/applicant/exam-only/bookings/route'
import { requireApplicant } from '@/lib/auth/helpers'

const mockUser = { id: 'user-1', role: 'APPLICANT' }

const mockPool = {
  id: 'pool-1',
  name: 'ATPL Pool',
  examDate: new Date('2026-10-01T00:00:00.000Z'),
  examStartTime: new Date('2026-10-01T09:00:00.000Z'),
  examEndTime: new Date('2026-10-01T17:00:00.000Z'),
  status: 'OPEN',
  currentMemberCount: 5,
  maxCandidates: 20,
  seatPrice: 500,
  allowedModules: ['MOD1', 'MOD2'],
  preSeedModules: ['MOD1'],
  event: { name: 'ATPL Exam Event' },
}

const mockBooking = {
  id: 'booking-1',
  userId: 'user-1',
  status: 'CONFIRMED',
  amountPaid: 500,
  examDate: new Date('2026-10-01T00:00:00.000Z'),
  examComponent: {
    course: { code: 'ATPL', name: 'Airline Transport' },
  },
}

describe('Applicant Exams — GET /api/applicant/exam-only/pools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireApplicant as any).mockResolvedValue(mockUser)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireApplicant as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/applicant/exam-only/pools', { method: 'GET' })
    const res = await GetPools(req)
    expect(res.status).toBe(401)
  })

  it('returns available pools with correct shape', async () => {
    prismaMock.examPool.findMany.mockResolvedValueOnce([mockPool] as any)

    const req = new NextRequest('http://localhost/api/applicant/exam-only/pools', { method: 'GET' })
    const res = await GetPools(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json).toHaveLength(1)
    expect(json[0].id).toBe('pool-1')
    expect(json[0].name).toBe('ATPL Pool')
    expect(json[0].status).toBe('OPEN')
    expect(json[0].currentMemberCount).toBe(5)
    expect(json[0].maxCandidates).toBe(20)
    expect(json[0].seatPrice).toBe(500)
    expect(json[0].allowedModules).toEqual(['MOD1', 'MOD2'])
    expect(json[0].modules).toEqual(['MOD1'])
    expect(json[0].event.name).toBe('ATPL Exam Event')
    expect(json[0].examDate).toBe('2026-10-01T00:00:00.000Z')
  })

  it('filters pools by status', async () => {
    prismaMock.examPool.findMany.mockResolvedValueOnce([] as any)

    const req = new NextRequest('http://localhost/api/applicant/exam-only/pools', { method: 'GET' })
    await GetPools(req)

    expect(prismaMock.examPool.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: ['OPEN', 'NEAR_FULL', 'CONFIRMED', 'DRAFT'] },
        },
        orderBy: { examDate: 'asc' },
      })
    )
  })

  it('returns empty array when no pools exist', async () => {
    prismaMock.examPool.findMany.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost/api/applicant/exam-only/pools', { method: 'GET' })
    const res = await GetPools(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toHaveLength(0)
  })
})

describe('Applicant Exams — GET /api/applicant/exam-only/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireApplicant as any).mockResolvedValue(mockUser)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireApplicant as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/applicant/exam-only/bookings', {
      method: 'GET',
    })
    const res = await GetBookings(req)
    expect(res.status).toBe(401)
  })

  it('returns paginated bookings with correct shape', async () => {
    prismaMock.examBooking.findMany.mockResolvedValueOnce([mockBooking] as any)
    prismaMock.examBooking.count.mockResolvedValueOnce(1)

    const req = new NextRequest(
      'http://localhost/api/applicant/exam-only/bookings?page=1&limit=20',
      { method: 'GET' }
    )
    const res = await GetBookings(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].id).toBe('booking-1')
    expect(json.data[0].status).toBe('CONFIRMED')
    expect(json.data[0].amountPaid).toBe(500)
    expect(json.data[0].examDate).toBe('2026-10-01T00:00:00.000Z')
    expect(json.data[0].examComponent.course.code).toBe('ATPL')
    expect(json.meta.total).toBe(1)
  })

  it('filters bookings by userId and INDIVIDUAL type', async () => {
    prismaMock.examBooking.findMany.mockResolvedValueOnce([] as any)
    prismaMock.examBooking.count.mockResolvedValueOnce(0)

    const req = new NextRequest(
      'http://localhost/api/applicant/exam-only/bookings?page=1&limit=20',
      { method: 'GET' }
    )
    await GetBookings(req)

    expect(prismaMock.examBooking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          bookingType: 'INDIVIDUAL',
        },
      })
    )
  })

  it('returns empty when user has no bookings', async () => {
    prismaMock.examBooking.findMany.mockResolvedValueOnce([])
    prismaMock.examBooking.count.mockResolvedValueOnce(0)

    const req = new NextRequest(
      'http://localhost/api/applicant/exam-only/bookings?page=1&limit=20',
      { method: 'GET' }
    )
    const res = await GetBookings(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toHaveLength(0)
    expect(json.meta.total).toBe(0)
  })
})
