import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
  requireStudent: vi.fn(),
}))

import { GET } from '@/app/api/student/certificates/route'

function makeExamResult(overrides: Record<string, any> = {}) {
  return {
    id: 'result-1',
    userId: 'student-1',
    passed: true,
    createdAt: new Date('2026-08-31'),
    exam: {
      id: 'exam-1',
      examComponent: {
        id: 'comp-1',
        code: 'M01',
        name: 'Aviation Regulations',
        course: { code: 'ATPL', name: 'ATPL Theory' },
      },
    },
    ...overrides,
  }
}

describe('GET /api/student/certificates', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    const { requireStudent } = await import('@/lib/auth/helpers')
    vi.mocked(requireStudent).mockRejectedValueOnce(new Error('Unauthorized'))

    const req = new NextRequest('http://localhost/api/student/certificates')
    const res = await GET(req, { params: Promise.resolve({}) })
    expect(res.status).toBe(401)
  })

  it('returns paginated passed exams', async () => {
    const { requireStudent } = await import('@/lib/auth/helpers')
    vi.mocked(requireStudent).mockResolvedValueOnce({ id: 'student-1', role: 'STUDENT' } as any)

    prismaMock.examResult.findMany.mockResolvedValueOnce([makeExamResult()] as any)
    prismaMock.examResult.count.mockResolvedValueOnce(1)

    const req = new NextRequest('http://localhost/api/student/certificates')
    const res = await GET(req, { params: Promise.resolve({}) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })

  it('only returns passed exams', async () => {
    const { requireStudent } = await import('@/lib/auth/helpers')
    vi.mocked(requireStudent).mockResolvedValueOnce({ id: 'student-1', role: 'STUDENT' } as any)

    prismaMock.examResult.findMany.mockResolvedValueOnce([] as any)
    prismaMock.examResult.count.mockResolvedValueOnce(0)

    const req = new NextRequest('http://localhost/api/student/certificates')
    await GET(req, { params: Promise.resolve({}) })

    expect(prismaMock.examResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'student-1', passed: true },
      })
    )
  })

  it('includes exam component and course data', async () => {
    const { requireStudent } = await import('@/lib/auth/helpers')
    vi.mocked(requireStudent).mockResolvedValueOnce({ id: 'student-1', role: 'STUDENT' } as any)

    prismaMock.examResult.findMany.mockResolvedValueOnce([makeExamResult()] as any)
    prismaMock.examResult.count.mockResolvedValueOnce(1)

    const req = new NextRequest('http://localhost/api/student/certificates')
    const res = await GET(req, { params: Promise.resolve({}) })
    const json = await res.json()

    expect(json.data[0].exam.examComponent.code).toBe('M01')
    expect(json.data[0].exam.examComponent.course.code).toBe('ATPL')
  })

  it('supports pagination', async () => {
    const { requireStudent } = await import('@/lib/auth/helpers')
    vi.mocked(requireStudent).mockResolvedValueOnce({ id: 'student-1', role: 'STUDENT' } as any)

    prismaMock.examResult.findMany.mockResolvedValueOnce([] as any)
    prismaMock.examResult.count.mockResolvedValueOnce(50)

    const req = new NextRequest('http://localhost/api/student/certificates?page=2&limit=10')
    const res = await GET(req, { params: Promise.resolve({}) })
    const json = await res.json()

    expect(json.meta.page).toBe(2)
    expect(json.meta.limit).toBe(10)
    expect(prismaMock.examResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    )
  })

  it('returns empty array when no passed exams', async () => {
    const { requireStudent } = await import('@/lib/auth/helpers')
    vi.mocked(requireStudent).mockResolvedValueOnce({ id: 'student-1', role: 'STUDENT' } as any)

    prismaMock.examResult.findMany.mockResolvedValueOnce([] as any)
    prismaMock.examResult.count.mockResolvedValueOnce(0)

    const req = new NextRequest('http://localhost/api/student/certificates')
    const res = await GET(req, { params: Promise.resolve({}) })
    const json = await res.json()

    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
  })
})
