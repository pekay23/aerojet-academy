import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'

// Mock server-only and next/cache
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock auth helpers — factory references the mock function defined below
const mockRequireStaff = vi.fn()
vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: () => mockRequireStaff(),
}))

// Mock audit logger so the POST test doesn't require a real DB audit row
vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(() => Promise.resolve()),
  AuditAction: { UPDATE: 'UPDATE' },
}))

// Import after mocks are set up (vitest hoists vi.mock above imports)
import { GET, POST } from '@/app/api/staff/attendance/route'

function makeRequest(url: string, init?: RequestInit): Request {
  return new Request(url, init)
}

describe('GET /api/staff/attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireStaff.mockResolvedValue({ id: 'staff-1', email: 'staff@test.com' })
  })

  it('includes PENDING enrollments in the roster', async () => {
    prismaMock.attendanceRecord.findMany.mockResolvedValue([])
    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-1',
      name: 'Test Class',
      courseId: 'course-1',
    })
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        user: {
          id: 'user-1',
          email: 'pending@test.com',
          profile: { firstName: 'Pending', lastName: 'User' },
          studentProfile: { studentId: 'AATA-2026-0001' },
        },
      },
    ])

    const res = await GET(
      makeRequest('http://localhost/api/staff/attendance?classId=class-1&date=2026-09-10') as any
    )
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.roster).toHaveLength(1)
    expect(json.data.roster[0].email).toBe('pending@test.com')
    // Verify the enrollment query included PENDING status
    expect(prismaMock.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['ENROLLED', 'ACTIVE', 'APPROVED', 'PENDING'] },
        }),
      })
    )
  })

  it('filters attendance records by the requested date', async () => {
    prismaMock.attendanceRecord.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        status: 'PRESENT',
        minutesLate: null,
        notes: null,
        user: {
          id: 'user-1',
          email: 'present@test.com',
          profile: { firstName: 'Present', lastName: 'User' },
          studentProfile: { studentId: 'AATA-2026-0002' },
        },
      },
    ])
    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-1',
      name: 'Test Class',
      courseId: 'course-1',
    })
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        user: {
          id: 'user-1',
          email: 'present@test.com',
          profile: { firstName: 'Present', lastName: 'User' },
          studentProfile: { studentId: 'AATA-2026-0002' },
        },
      },
    ])

    const res = await GET(
      makeRequest('http://localhost/api/staff/attendance?classId=class-1&date=2026-09-10') as any
    )
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.records).toHaveLength(1)
    // Verify the attendance query used a date range filter
    expect(prismaMock.attendanceRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          classId: 'class-1',
          date: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
        }),
      })
    )
  })

  it('returns 401 when not authenticated as staff', async () => {
    mockRequireStaff.mockRejectedValue(new Error('Unauthorized'))

    const res = await GET(
      makeRequest('http://localhost/api/staff/attendance?classId=class-1') as any
    )
    expect(res.status).toBe(401)
  })
})

describe('POST /api/staff/attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireStaff.mockResolvedValue({ id: 'staff-1', email: 'staff@test.com' })
  })

  it('creates and updates attendance records in a transaction', async () => {
    prismaMock.classSession.findMany.mockResolvedValue([])
    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-1',
      courseId: 'course-1',
    })
    prismaMock.enrollment.findMany.mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-2' },
    ])
    prismaMock.$transaction.mockImplementation(async (fn: any) => {
      if (typeof fn === 'function') {
        return fn(prismaMock)
      }
      return Promise.resolve(fn)
    })
    prismaMock.attendanceRecord.upsert.mockResolvedValue({})

    const body = {
      classId: 'class-1',
      date: '2026-09-10',
      records: [
        { userId: 'user-1', status: 'PRESENT' },
        { userId: 'user-2', status: 'ABSENT' },
      ],
    }

    const req = makeRequest('http://localhost/api/staff/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const res = await POST(req as any)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.saved).toBe(2)
    expect(prismaMock.attendanceRecord.upsert).toHaveBeenCalledTimes(2)
  })

  it('rejects invalid input', async () => {
    const req = makeRequest('http://localhost/api/staff/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classId: 'class-1',
        date: '2026-09-10',
        records: [{ userId: 'user-1', status: 'INVALID_STATUS' }],
      }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })
})
