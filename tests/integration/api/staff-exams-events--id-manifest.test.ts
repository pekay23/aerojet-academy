import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } }),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }),
  requireInstructor: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requirePermission: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  verifyPassword: vi.fn().mockResolvedValue(true),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
  generateStudentId: vi.fn().mockReturnValue('STU-001'),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiCreated: vi.fn((data) => ({ status: 201, json: () => Promise.resolve(data) })),
  apiPaginated: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((msg, status) => ({ status: status || 400, json: () => Promise.resolve({ error: msg }) })),
  apiUnauthorized: vi.fn(() => ({ status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) })),
  apiForbidden: vi.fn(() => ({ status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) })),
  apiNotFound: vi.fn((msg) => ({ status: 404, json: () => Promise.resolve({ error: msg }) })),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
  withErrorHandler: vi.fn((fn) => {
    return async (req: any, ctx: any) => {
      try {
        const resolvedCtx = ctx?.params ? { ...ctx, params: await ctx.params } : ctx
        return await fn(req, resolvedCtx)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Unauthorized') return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }
        if (message === 'Forbidden') return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }
        return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) }
      }
    }
  }),
}))

import { GET } from '@/app/api/staff/exams/events/[id]/manifest/route.ts'
import { requireStaff } from '@/lib/auth/helpers'

describe('/staff/exams/events/:id/manifest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
    prismaMock.examEvent.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/exams/events/1/manifest')
    const res = await GET(req, { params: { eventId: '1' } } as any)
    expect(res.status).toBe(401)
  })

  it('returns 404 when event not found', async () => {
    prismaMock.examEvent.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/staff/exams/events/1/manifest')
    const res = await GET(req, { params: { eventId: '1' } } as any)
    expect(res.status).toBe(404)
  })

  it('returns 200 with csv format', async () => {
    prismaMock.examEvent.findUnique.mockResolvedValueOnce({
      id: '1',
      sittings: [{
        sessionType: 'MORNING',
        examComponent: { code: 'MOD1' },
        dayNumber: 1,
        startTime: new Date(),
        venue: 'Room A',
        assignments: [{
          user: { profile: { firstName: 'John', lastName: 'Doe' }, email: 'john@test.com' },
          seatId: 'S1',
          attendanceStatus: 'PRESENT'
        }]
      }]
    } as any)
    const req = new NextRequest('http://localhost/staff/exams/events/1/manifest?format=csv')
    const res = await GET(req, { params: { eventId: '1' } } as any)
    expect(res.status).toBe(200)
  })

  it('returns 400 for unsupported format', async () => {
    prismaMock.examEvent.findUnique.mockResolvedValueOnce({ id: '1', sittings: [] } as any)
    const req = new NextRequest('http://localhost/staff/exams/events/1/manifest?format=json')
    const res = await GET(req, { params: { eventId: '1' } } as any)
    expect(res.status).toBe(400)
  })
})
