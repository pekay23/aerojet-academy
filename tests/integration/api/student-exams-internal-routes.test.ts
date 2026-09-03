import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
  requireStudent: vi.fn(),
  requireInstructor: vi.fn(),
  requireApplicant: vi.fn(),
  requireExaminer: vi.fn(),
  requireAdminOrStaff: vi.fn(),
  requirePermission: vi.fn(),
  getClientIp: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  generateToken: vi.fn(),
  generateTempPassword: vi.fn(),
  generateAcademyEmail: vi.fn(),
  generateStudentId: vi.fn(),
  checkRateLimit: vi.fn(),
  generateRegistrationCode: vi.fn(),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((_d: any) => ({ status: 200, json: () => Promise.resolve({ success: true, data: _d }) })),
  apiCreated: vi.fn((_d: any) => ({ status: 201, json: () => Promise.resolve({ success: true, data: _d }) })),
  apiError: vi.fn((msg: any, status?: number) => ({ status: status || 400, json: () => Promise.resolve({ error: msg }) })),
  withErrorHandler: vi.fn((fn: any) => {
    return async (req: any, ctx?: any) => {
      try {
        const resolvedCtx = ctx?.params ? { ...ctx, params: await ctx.params } : ctx
        return await fn(req, resolvedCtx)
      } catch (err: any) {
        const m = err instanceof Error ? err.message : String(err)
        if (m === 'Unauthorized') return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }
        if (m === 'Forbidden') return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }
        return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) }
      }
    }
  }),
}))

vi.mock('@/lib/internal-exam/engine', () => ({
  isInternalExamSystemEnabled: vi.fn().mockResolvedValue(true),
  getBankRules: vi.fn().mockResolvedValue({ passMarkPct: 75, timePerQuestionSecs: 75, retakeWaitDays: 90, maxRetakes: 3, completionWindowYears: 10, allowKeyboardAutoSubmit: true, customInstructions: null }),
}))

import { getAuthSession } from '@/lib/auth/helpers'
import { isInternalExamSystemEnabled, getBankRules } from '@/lib/internal-exam/engine'
import { GET as getSession } from '@/app/api/student/exams/internal/session/route'
import { POST as postAnswer } from '@/app/api/student/exams/internal/answer/route'

const STUDENT_SESSION = { user: { id: 'stu-1', role: 'STUDENT' } }

describe('internal-exam student routes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => (typeof fn === 'function' ? fn(prismaMock) : Promise.resolve(fn)))
    ;(getAuthSession as any).mockResolvedValue(STUDENT_SESSION)
    ;(isInternalExamSystemEnabled as any).mockResolvedValue(true)
    ;(getBankRules as any).mockResolvedValue({ passMarkPct: 75 })
  })

  describe('GET /student/exams/internal/session', () => {
    it('401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const res = await getSession(new NextRequest('http://x/session?sessionId=s1'))
      expect(res.status).toBe(401)
    })
    it('403 for a non-student role', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce({ user: { id: 'stu-1', role: 'INSTRUCTOR' } })
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'INSTRUCTOR' })
      const res = await getSession(new NextRequest('http://x/session?sessionId=s1'))
      expect(res.status).toBe(403)
    })
    it('400 when sessionId is missing', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'STUDENT' })
      const res = await getSession(new NextRequest('http://x/session'))
      expect(res.status).toBe(400)
    })
    it('404 when the session does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'STUDENT' })
      prismaMock.internalExamSession.findUnique.mockResolvedValueOnce(null)
      const res = await getSession(new NextRequest('http://x/session?sessionId=s1'))
      expect(res.status).toBe(404)
    })
    it('403 when the session belongs to another student', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'STUDENT' })
      prismaMock.internalExamSession.findUnique.mockResolvedValueOnce({ studentId: 'other', answers: [], bank: { id: 'b1', name: 'b' } } as any)
      const res = await getSession(new NextRequest('http://x/session?sessionId=s1'))
      expect(res.status).toBe(403)
    })
    it('200 with completed payload (no rules fetch needed)', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'STUDENT' })
      prismaMock.internalExamSession.findUnique.mockResolvedValueOnce({
        studentId: 'stu-1', status: 'COMPLETED', score: 30, totalPoints: 40, percentage: 75, passed: true, categoryCode: 'P',
        answers: [], bank: { id: 'b1', name: 'B' }, expiresAt: null, startedAt: new Date(),
      } as any)
      const res = await getSession(new NextRequest('http://x/session?sessionId=s1'))
      expect(res.status).toBe(200)
      expect((await res.json()).data).toHaveProperty('completed', true)
      expect(getBankRules).not.toHaveBeenCalled()
    })
    it('200 with in-progress payload (fetches bank rules)', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'STUDENT' })
      prismaMock.internalExamSession.findUnique.mockResolvedValueOnce({
        studentId: 'stu-1', status: 'IN_PROGRESS', bankId: 'b1', answers: [], bank: { id: 'b1', name: 'B' },
        expiresAt: new Date(Date.now() + 600_000), startedAt: new Date(),
      } as any)
      const res = await getSession(new NextRequest('http://x/session?sessionId=s1'))
      expect(res.status).toBe(200)
      expect((await res.json()).data).toHaveProperty('rules')
      expect(getBankRules).toHaveBeenCalledWith('b1')
    })
  })

  describe('POST /student/exams/internal/answer', () => {
    it('401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const res = await postAnswer(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionId: 's1', questionId: 'q1', selectedAnswer: 'a' }) }))
      expect(res.status).toBe(401)
    })
    it('403 for a non-student role', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce({ user: { id: 'stu-1', role: 'INSTRUCTOR' } })
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'INSTRUCTOR' })
      const res = await postAnswer(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionId: 's1', questionId: 'q1', selectedAnswer: 'a' }) }))
      expect(res.status).toBe(403)
    })
    it('400 on invalid schema (missing fields)', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'STUDENT' })
      const res = await postAnswer(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({}) }))
      expect(res.status).toBe(400)
    })
    it('404 when the session does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'STUDENT' })
      prismaMock.internalExamSession.findUnique.mockResolvedValueOnce(null)
      const res = await postAnswer(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionId: 's1', questionId: 'q1', selectedAnswer: 'a' }) }))
      expect(res.status).toBe(404)
    })
    it('403 when the session belongs to another student', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'STUDENT' })
      prismaMock.internalExamSession.findUnique.mockResolvedValueOnce({ studentId: 'other', status: 'IN_PROGRESS', expiresAt: null } as any)
      const res = await postAnswer(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionId: 's1', questionId: 'q1', selectedAnswer: 'a' }) }))
      expect(res.status).toBe(403)
    })
    it('410 when the session has expired', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'STUDENT' })
      prismaMock.internalExamSession.findUnique.mockResolvedValueOnce({ studentId: 'stu-1', status: 'IN_PROGRESS', expiresAt: new Date(Date.now() - 1000) } as any)
      const res = await postAnswer(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionId: 's1', questionId: 'q1', selectedAnswer: 'a' }) }))
      expect(res.status).toBe(410)
    })
    it('404 when no answer record exists for the question', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'STUDENT' })
      prismaMock.internalExamSession.findUnique.mockResolvedValueOnce({ studentId: 'stu-1', status: 'IN_PROGRESS', expiresAt: null } as any)
      prismaMock.internalExamAnswer.findFirst.mockResolvedValueOnce(null)
      const res = await postAnswer(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionId: 's1', questionId: 'q1', selectedAnswer: 'a' }) }))
      expect(res.status).toBe(404)
    })
    it('200 saves the answer', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'STUDENT' })
      prismaMock.internalExamSession.findUnique.mockResolvedValueOnce({ studentId: 'stu-1', status: 'IN_PROGRESS', expiresAt: null } as any)
      prismaMock.internalExamAnswer.findFirst.mockResolvedValueOnce({ id: 'ans-1' } as any)
      const res = await postAnswer(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionId: 's1', questionId: 'q1', selectedAnswer: 'a' }) }))
      expect(res.status).toBe(200)
      expect(prismaMock.internalExamAnswer.update).toHaveBeenCalledWith({ where: { id: 'ans-1' }, data: { selectedAnswer: 'a', answeredAt: expect.any(Date) } })
    })
  })
})
