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
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ message, error: message }),
  })),
  withErrorHandler: vi.fn((fn: any) => {
    return async (req: any, ctx?: any) => {
      try {
        const resolvedCtx = ctx?.params ? { ...ctx, params: await ctx.params } : ctx
        return await fn(req, resolvedCtx)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Unauthorized')
          return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }
        if (message === 'Forbidden')
          return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }
        return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) }
      }
    }
  }),
}))

import { POST } from '@/app/api/staff/admissions/interviews/schedules/[id]/slots/route'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('POST /api/staff/admissions/interviews/schedules/[id]/slots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  const params = { params: Promise.resolve({ id: 'schedule-1' }) }

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/interviews/schedules/schedule-1/slots',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer test-secret' },
          body: JSON.stringify({}),
        }
      )
      const res = await POST(req, params)
      expect(res.status).toBe(401)
    })

    it('returns 400 for invalid input', async () => {
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/interviews/schedules/schedule-1/slots',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer test-secret' },
          body: JSON.stringify({ invalid: 'data' }),
        }
      )
      const res = await POST(req, params)
      expect(res.status).toBe(400)
    })

    it('creates resource on valid input', async () => {
      prismaMock.interviewSchedule.findUnique.mockResolvedValueOnce({ id: 'schedule-1' } as any)
      prismaMock.interviewSlot.create.mockResolvedValueOnce({ id: 'slot-1' } as any)
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/interviews/schedules/schedule-1/slots',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer test-secret' },
          body: JSON.stringify({
            date: '2024-01-01T00:00:00.000Z',
            startTime: '2024-01-01T10:00:00.000Z',
            endTime: '2024-01-01T11:00:00.000Z',
            capacity: 1,
            location: 'Room A',
            notes: 'test',
          }),
        }
      )
      const res = await POST(req, params)
      expect(res.status).toBe(200)
    })
  })
})
