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
  apiError: vi.fn((message, status) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
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
  })
}))

vi.mock('@/lib/settings', () => ({
  getAptitudeConfig: vi.fn().mockReturnValue({
    aptitude_time_limit_minutes: 30,
    aptitude_pass_threshold_pct: 60,
    aptitude_math_count: 5,
    aptitude_english_count: 5,
    aptitude_engineering_count: 5,
    aptitude_reasoning_count: 5,
    aptitude_physics_count: 5,
    aptitude_max_tab_switches: 3,
    aptitude_require_for_modular: true,
    aptitude_shuffle_questions: true,
    aptitude_shuffle_options: true,
  })
}))

import { GET } from '@/app/api/staff/admissions/aptitude/preview/route.ts'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('GET /api/staff/admissions/aptitude/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns 400 when bankId is missing', async () => {
      const req = new NextRequest('http://localhost/api/staff/admissions/aptitude/preview', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(400)
    })

    it('returns preview for valid bankId', async () => {
      prismaMock.aptitudeTestBank.findUnique.mockResolvedValueOnce({ id: '1', name: 'Test Bank' } as any)
      prismaMock.aptitudeQuestion.findMany.mockResolvedValueOnce([
        { id: '1', category: 'MATH', questionType: 'MCQ', difficulty: 'EASY', text: 'Q1', options: null, correctAnswer: 'A', explanation: null, points: 1, isActive: true, bankId: '1' },
      ] as any)
      const req = new NextRequest('http://localhost/api/staff/admissions/aptitude/preview?bankId=1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

  })

})
