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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/applicant/aptitude/anti-cheat/route'
import { requireAuth } from '@/lib/auth/helpers'

describe('/applicant/aptitude/anti-cheat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireAuth as any).mockResolvedValue({ id: 'user-1', role: 'APPLICANT' })
    prismaMock.aptitudeTestSession.findUnique.mockResolvedValue(null as any)
    prismaMock.aptitudeTestSession.update.mockResolvedValue({} as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/applicant/aptitude/anti-cheat', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    const req = new NextRequest('http://localhost/applicant/aptitude/anti-cheat', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when session not found', async () => {
    prismaMock.aptitudeTestSession.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/anti-cheat', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'ck1a1b2c3d0001aaaa1111a', eventType: 'TAB_SWITCH' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 403 when session belongs to another user', async () => {
    prismaMock.aptitudeTestSession.findUnique.mockResolvedValueOnce({
      id: 'ck1a1b2c3d0001aaaa1111a',
      userId: 'user-2',
      status: 'IN_PROGRESS',
      tabSwitchCount: 0,
      fullscreenExits: 0,
    } as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/anti-cheat', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'ck1a1b2c3d0001aaaa1111a', eventType: 'TAB_SWITCH' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 with ignored when session not in progress', async () => {
    prismaMock.aptitudeTestSession.findUnique.mockResolvedValueOnce({
      id: 'ck1a1b2c3d0001aaaa1111a',
      userId: 'user-1',
      status: 'COMPLETED',
      tabSwitchCount: 0,
      fullscreenExits: 0,
    } as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/anti-cheat', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'ck1a1b2c3d0001aaaa1111a', eventType: 'TAB_SWITCH' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ignored: true })
  })

  it('returns 200 with FLAGGED when violations exceed limit', async () => {
    prismaMock.aptitudeTestSession.findUnique.mockResolvedValueOnce({
      id: 'ck1a1b2c3d0001aaaa1111a',
      userId: 'user-1',
      status: 'IN_PROGRESS',
      tabSwitchCount: 3,
      fullscreenExits: 0,
    } as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/anti-cheat', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'ck1a1b2c3d0001aaaa1111a', eventType: 'FULLSCREEN_EXIT' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ status: 'FLAGGED' })
  })
})
