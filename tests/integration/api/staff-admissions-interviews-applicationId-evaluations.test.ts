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

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {},
  queryAuditLogs: vi.fn(),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ message, error: message }),
  })),
  apiCreated: vi.fn((data: any) => ({ status: 201, json: () => Promise.resolve(data) })),
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

import { GET } from '@/app/api/staff/admissions/interviews/[applicationId]/evaluations/route'
import { POST } from '@/app/api/staff/admissions/interviews/[applicationId]/evaluations/route'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('GET/POST /api/staff/admissions/interviews/[applicationId]/evaluations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns evaluations list', async () => {
      prismaMock.interviewEvaluation.findMany.mockResolvedValueOnce([
        {
          id: 'eval-1',
          applicationId: 'app-1',
          communicationScore: 8,
          evaluator: {
            id: 'staff-1',
            email: 'test@test.com',
            profile: { firstName: 'Test', lastName: 'User' },
          },
        },
      ] as any)
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/interviews/app-1/evaluations?page=1&limit=20',
        {
          headers: { Authorization: 'Bearer test-secret' },
        }
      )
      const res = await GET(req, { params: Promise.resolve({ applicationId: 'app-1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns empty list when no evaluations', async () => {
      prismaMock.interviewEvaluation.findMany.mockResolvedValueOnce([])
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/interviews/app-1/evaluations',
        {
          headers: { Authorization: 'Bearer test-secret' },
        }
      )
      const res = await GET(req, { params: Promise.resolve({ applicationId: 'app-1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/interviews/app-1/evaluations',
        {
          headers: { Authorization: 'Bearer test-secret' },
        }
      )
      const res = await GET(req, { params: Promise.resolve({ applicationId: 'app-1' }) })
      expect(res.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAdmin as any).mockRejectedValueOnce(new Error('Unauthorized'))
      ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/interviews/app-1/evaluations',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer test-secret' },
          body: JSON.stringify({}),
        }
      )
      const res = await POST(req, { params: Promise.resolve({ applicationId: 'app-1' }) })
      expect(res.status).toBe(401)
    })

    it('returns 400 for invalid input', async () => {
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/interviews/app-1/evaluations',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer test-secret' },
          body: JSON.stringify({ invalid: 'data' }),
        }
      )
      const res = await POST(req, { params: Promise.resolve({ applicationId: 'app-1' }) })
      expect(res.status).toBe(400)
    })

    it('creates evaluation on valid input', async () => {
      prismaMock.application.findUnique.mockResolvedValueOnce({
        id: 'app-1',
        stage: 'INTERVIEW_SCHEDULED',
      } as any)
      prismaMock.interviewEvaluation.upsert.mockResolvedValueOnce({
        id: 'eval-1',
        applicationId: 'app-1',
        evaluatorId: 'staff-1',
        communicationScore: 8,
        technicalScore: 8,
        motivationScore: 8,
        problemSolvingScore: 8,
        teamworkScore: 8,
        professionalismScore: 8,
        overallImpression: 8,
        personalScore: 80,
        recommendation: 'YES',
      } as any)
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/interviews/app-1/evaluations',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer test-secret' },
          body: JSON.stringify({
            communicationScore: 8,
            technicalScore: 8,
            motivationScore: 8,
            problemSolvingScore: 8,
            teamworkScore: 8,
            professionalismScore: 8,
            overallImpression: 8,
            personalScore: 80,
            recommendation: 'YES',
          }),
        }
      )
      const res = await POST(req, { params: Promise.resolve({ applicationId: 'app-1' }) })
      expect(res.status).toBe(201)
    })
  })
})
