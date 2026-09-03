import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireExaminer: vi.fn(),
  verifyPassword: vi.fn().mockResolvedValue(true),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
}))

import { GET, POST } from '@/app/api/examiner/results/route'
import { requireExaminer } from '@/lib/auth/helpers'

const mockUser = { id: 'user-1', role: 'EXAMINER' }
const mockExaminer = { id: 'examiner-1', userId: 'user-1' }
const mockSitting = {
  id: 'sitting-1',
  examinerId: 'examiner-1',
  startTime: '2026-10-01T09:00:00.000Z',
  event: { name: 'ATPL Sitting' },
  examComponent: {
    course: { code: 'ATPL', name: 'Airline Transport' },
  },
  assignments: [
    {
      userId: 'student-1',
      user: { id: 'student-1', profile: { firstName: 'Alice', lastName: 'Smith' } },
      booking: { moduleCode: 'MOD1', examId: 'exam-1' },
    },
  ],
}
const mockExistingResult = {
  userId: 'student-1',
  moduleCode: 'MOD1',
  examId: 'exam-1',
  score: 85,
  passed: true,
}

describe('Examiner Results — GET /api/examiner/results', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireExaminer as any).mockResolvedValue(mockUser)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireExaminer as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/examiner/results', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 404 when examiner profile not found', async () => {
    prismaMock.examiner.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/examiner/results', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it('returns sittings and existingResults on success', async () => {
    prismaMock.examiner.findUnique.mockResolvedValueOnce(mockExaminer as any)
    prismaMock.examSitting.findMany.mockResolvedValueOnce([mockSitting] as any)
    prismaMock.examResult.findMany.mockResolvedValueOnce([mockExistingResult] as any)

    const req = new NextRequest('http://localhost/api/examiner/results', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.sittings).toHaveLength(1)
    expect(json.data.sittings[0].id).toBe('sitting-1')
    expect(json.data.sittings[0].assignments).toHaveLength(1)
    expect(json.data.existingResults).toHaveLength(1)
    expect(json.data.existingResults[0].score).toBe(85)
    expect(json.data.existingResults[0].passed).toBe(true)
  })

  it('returns empty results when no sittings assigned', async () => {
    prismaMock.examiner.findUnique.mockResolvedValueOnce(mockExaminer as any)
    prismaMock.examSitting.findMany.mockResolvedValueOnce([])
    prismaMock.examResult.findMany.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost/api/examiner/results', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data.sittings).toHaveLength(0)
    expect(json.data.existingResults).toHaveLength(0)
  })
})

describe('Examiner Results — POST /api/examiner/results', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 405 method not allowed', async () => {
    const req = new NextRequest('http://localhost/api/examiner/results', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(405)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('server action')
  })
})
