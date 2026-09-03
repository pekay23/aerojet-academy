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

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi
    .fn()
    .mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'APPLICANT' } }),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi.fn().mockResolvedValue({ id: 'user-1', role: 'APPLICANT' }),
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

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  logAuditEvent: vi.fn(),
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    PAYMENT_APPROVE: 'PAYMENT_APPROVE',
    ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE',
  },
}))

vi.mock('@/lib/email/service', () => ({
  sendPaymentApprovedEmail: vi.fn(),
  sendPaymentRejectedEmail: vi.fn(),
  sendStudentPromotionEmail: vi.fn(),
  sendActivationEmail: vi.fn(),
}))

vi.mock('@/lib/settings', () => ({
  getAptitudeConfig: vi.fn().mockResolvedValue({
    aptitude_time_limit_minutes: 60,
    aptitude_pass_threshold_pct: 50,
    aptitude_math_count: 10,
    aptitude_english_count: 10,
    aptitude_engineering_count: 5,
    aptitude_reasoning_count: 5,
    aptitude_physics_count: 0,
    aptitude_max_tab_switches: 3,
    aptitude_require_for_modular: false,
    aptitude_shuffle_questions: true,
    aptitude_shuffle_options: true,
  }),
}))

vi.mock('@/lib/aptitude/question-selector', () => ({
  selectQuestions: vi.fn().mockResolvedValue(['q-1', 'q-2', 'q-3']),
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/applicant/aptitude/start/route'
import { requireAuth } from '@/lib/auth/helpers'

describe('/applicant/aptitude/start', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireAuth as any).mockResolvedValue({ id: 'user-1', role: 'APPLICANT' })
    prismaMock.application.findUnique.mockResolvedValue(null as any)
    prismaMock.aptitudeTestSession.findFirst.mockResolvedValue(null as any)
    prismaMock.aptitudeTestBank.findMany.mockResolvedValue(null as any)
    prismaMock.aptitudeTestSession.create.mockResolvedValue({
      id: 'session-1',
      expiresAt: new Date(),
    } as any)
    prismaMock.aptitudeTestSession.update.mockResolvedValue({} as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/applicant/aptitude/start', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when application stage is not APTITUDE_PENDING', async () => {
    prismaMock.application.findUnique.mockResolvedValueOnce({
      id: 'app-1',
      stage: 'UNDER_REVIEW',
    } as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/start', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 404 when application not found', async () => {
    prismaMock.application.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/start', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 500 when no active test banks found', async () => {
    prismaMock.application.findUnique.mockResolvedValueOnce({
      id: 'app-1',
      stage: 'APTITUDE_PENDING',
    } as any)
    prismaMock.aptitudeTestBank.findMany.mockResolvedValueOnce([])
    const req = new NextRequest('http://localhost/applicant/aptitude/start', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 200 with sessionId and expiresAt on success', async () => {
    prismaMock.application.findUnique.mockResolvedValueOnce({
      id: 'app-1',
      stage: 'APTITUDE_PENDING',
      programmeChoice: 'PLANE_MAINTENANCE',
    } as any)
    prismaMock.aptitudeTestBank.findMany.mockResolvedValueOnce([
      { id: 'bank-1', applicableProgrammes: ['PLANE_MAINTENANCE'], isActive: true },
    ] as any)
    prismaMock.aptitudeTestSession.create.mockResolvedValueOnce({
      id: 'session-1',
      expiresAt: new Date('2026-12-31T23:59:59Z'),
    } as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/start', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.sessionId).toBe('session-1')
    expect(json.expiresAt).toBeDefined()
  })
})
