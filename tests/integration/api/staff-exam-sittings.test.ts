import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
}))

import { GET } from '@/app/api/staff/exams/sittings/[id]/seats/route'
import { PUT } from '@/app/api/staff/exams/sittings/[id]/seats/route'

function makeSitting(overrides: Record<string, any> = {}) {
  return {
    id: 'sitting-1',
    eventId: 'event-1',
    examComponentId: 'comp-1',
    sessionType: 'THEORY',
    dayNumber: 1,
    startTime: new Date('2026-07-01T09:00:00Z'),
    endTime: new Date('2026-07-01T11:00:00Z'),
    venue: 'Room A',
    ...overrides,
  }
}

function makeAssignment(overrides: Record<string, any> = {}) {
  return {
    id: 'assign-1',
    sittingId: 'sitting-1',
    userId: 'user-1',
    seatId: 'seat-1',
    assignedAt: new Date('2026-06-15T08:00:00Z'),
    attendanceStatus: 'PRESENT',
    user: {
      id: 'user-1',
      email: 'student@example.com',
      profile: { firstName: 'Jane', lastName: 'Doe' },
    },
    seat: { id: 'seat-1', row: 'A', number: '1' },
    ...overrides,
  }
}

function makeSeat(overrides: Record<string, any> = {}) {
  return {
    id: 'seat-1',
    row: 'A',
    number: '1',
    ...overrides,
  }
}

describe('Staff Exam Sittings Seats — GET/PUT /api/staff/exams/sittings/[id]/seats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/staff/exams/sittings/sitting-1/seats')
    const res = await GET(req, { params: Promise.resolve({ id: 'sitting-1' }) })
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 403 when role is STUDENT', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STUDENT' } } as any)

    const req = new NextRequest('http://localhost/api/staff/exams/sittings/sitting-1/seats')
    const res = await GET(req, { params: Promise.resolve({ id: 'sitting-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when sitting not found', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)
    prismaMock.examSitting.findUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/staff/exams/sittings/sitting-1/seats')
    const res = await GET(req, { params: Promise.resolve({ id: 'sitting-1' }) })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Sitting not found')
  })

  it('returns sitting with assignments when found', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)

    const sitting = makeSitting({
      assignments: [makeAssignment()],
      event: { id: 'event-1', name: 'July Exam' },
      examComponent: { id: 'comp-1', code: 'M01', name: 'Module 1' },
    })
    prismaMock.examSitting.findUnique.mockResolvedValueOnce(sitting as any)

    const req = new NextRequest('http://localhost/api/staff/exams/sittings/sitting-1/seats')
    const res = await GET(req, { params: Promise.resolve({ id: 'sitting-1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('sitting-1')
    expect(json.event.name).toBe('July Exam')
    expect(json.examComponent.code).toBe('M01')
    expect(json.assignments).toHaveLength(1)
    expect(json.assignments[0].user.profile.firstName).toBe('Jane')
    expect(json.assignments[0].seat.row).toBe('A')
  })

  it('rejects PUT with invalid body', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)
    prismaMock.examSitting.findUnique.mockResolvedValueOnce(makeSitting() as any)

    const req = new NextRequest('http://localhost/api/staff/exams/sittings/sitting-1/seats', {
      method: 'PUT',
      body: JSON.stringify({ bad: true }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: 'sitting-1' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid data')
  })

  it('rejects PUT when sitting not found', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)
    prismaMock.examSitting.findUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/staff/exams/sittings/sitting-1/seats', {
      method: 'PUT',
      body: JSON.stringify({ assignments: [] }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: 'sitting-1' }) })
    expect(res.status).toBe(404)
  })

  it('updates seat assignments and returns updated list', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)

    prismaMock.examSitting.findUnique.mockResolvedValueOnce(makeSitting() as any)
    prismaMock.examSittingAssignment.update.mockResolvedValueOnce(makeAssignment({ seatId: 'seat-2' }) as any)
    prismaMock.examSittingAssignment.findMany.mockResolvedValueOnce([makeAssignment({ seatId: 'seat-2' })] as any)

    const req = new NextRequest('http://localhost/api/staff/exams/sittings/sitting-1/seats', {
      method: 'PUT',
      body: JSON.stringify({
        assignments: [{ assignmentId: 'assign-1', seatId: 'seat-2' }],
      }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: 'sitting-1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0].seatId).toBe('seat-2')

    expect(prismaMock.examSittingAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'assign-1' },
        data: { seatId: 'seat-2' },
      })
    )
  })
})
