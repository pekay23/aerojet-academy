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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/applicant/aptitude/session/route'
import { requireAuth } from '@/lib/auth/helpers'

describe('/applicant/aptitude/session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireAuth as any).mockResolvedValue({ id: 'user-1', role: 'APPLICANT' })
    prismaMock.aptitudeTestSession.findFirst.mockResolvedValue(null as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/applicant/aptitude/session')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with null when no session exists', async () => {
    prismaMock.aptitudeTestSession.findFirst.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/session')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeNull()
  })

  it('returns 200 with session data when session exists', async () => {
    prismaMock.aptitudeTestSession.findFirst.mockResolvedValueOnce({
      id: 'session-1',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-12-31T23:59:59Z'),
      answers: [
        {
          question: {
            id: 'q-1',
            category: 'MATH',
            questionType: 'MULTIPLE_CHOICE',
            text: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
          },
          selectedAnswer: '4',
        },
      ],
    } as any)
    const req = new NextRequest('http://localhost/applicant/aptitude/session')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('session-1')
    expect(json.status).toBe('IN_PROGRESS')
    expect(json.questions).toEqual([
      {
        questionId: 'q-1',
        category: 'MATH',
        questionType: 'MULTIPLE_CHOICE',
        text: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        selectedAnswer: '4',
      },
    ])
  })
})
