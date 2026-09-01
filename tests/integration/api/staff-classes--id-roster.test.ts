import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
  hashPassword: vi.fn(),
  generateToken: vi.fn(),
  generateTempPassword: vi.fn(),
  generateAcademyEmail: vi.fn(),
  getClientIp: vi.fn(),
  verifyPassword: vi.fn(),
  generateStudentId: vi.fn(),
  checkRateLimit: vi.fn(),
  requireStudent: vi.fn(),
  requireInstructor: vi.fn(),
  requireApplicant: vi.fn(),
  requireAdminOrStaff: vi.fn(),
  requireExaminer: vi.fn(),
  generateRegistrationCode: vi.fn(),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiNotFound: vi.fn((message) => ({ status: 404, json: () => Promise.resolve({ message, error: message }) })),
  withErrorHandler: vi.fn((fn) => {
    return async (req, ctx) => {
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

import { GET } from '@/app/api/staff/classes/[id]/roster/route.ts'
import { requireStaff } from '@/lib/auth/helpers'

describe('/staff/classes/:id/roster', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'user-1', role: 'ADMIN' })
    prismaMock.class.findUnique.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/staff/classes/1/roster')
    const res = await GET(req, { params: { id: '1' } })
    expect([401, 403]).toContain(res.status)
  })

  it('returns 200 with roster when class exists', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      id: '1',
      attendanceRecords: [],
    } as any)
    const req = new NextRequest('http://localhost/staff/classes/1/roster')
    const res = await GET(req, { params: { id: '1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 404 when class not found', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/staff/classes/999/roster')
    const res = await GET(req, { params: { id: '999' } })
    expect(res.status).toBe(404)
  })
})
