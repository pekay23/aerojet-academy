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

import { GET } from '@/app/api/student/attendance/route'
import { requireStudent } from '@/lib/auth/helpers'

describe('GET /api/student/attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStudent as any).mockResolvedValue({ id: 'student-1', role: 'STUDENT' })
    prismaMock.attendanceRecord.findMany.mockResolvedValue([])
    prismaMock.attendanceRecord.count.mockResolvedValue(0)
    prismaMock.attendanceRecord.groupBy.mockResolvedValue([{ status: 'PRESENT', _count: 1 }])
  })

  it('returns attendance records with summary', async () => {
    const records = [
      {
        id: 'a1',
        status: 'PRESENT',
        date: new Date('2026-01-01'),
        class: {
          course: { code: 'ATPL-01', name: 'ATPL Ground' },
        },
      },
    ]
    prismaMock.attendanceRecord.findMany.mockResolvedValue(records)
    prismaMock.attendanceRecord.count.mockResolvedValue(1)
    prismaMock.attendanceRecord.groupBy.mockResolvedValue([{ status: 'PRESENT', _count: { status: 1 } }])

    const req = new NextRequest('http://localhost/api/student/attendance?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.records).toHaveLength(1)
    expect(json.data.summary.total).toBe(1)
    expect(json.data.summary.present).toBe(1)
    expect(json.data.summary.rate).toBe(100)
  })

  it('returns empty records with zero summary', async () => {
    prismaMock.attendanceRecord.findMany.mockResolvedValue([])
    prismaMock.attendanceRecord.count.mockResolvedValue(0)
    prismaMock.attendanceRecord.groupBy.mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/student/attendance')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.records).toHaveLength(0)
    expect(json.data.summary.rate).toBe(0)
  })
})
