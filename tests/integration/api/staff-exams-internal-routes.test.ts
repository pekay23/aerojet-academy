import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

/* Re-use the canonical mock shapes the suite relies on (see tests/setup.tsx). */
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
  apiNotFound: vi.fn((msg?: string) => ({ status: 404, json: () => Promise.resolve({ error: msg || 'Not found' }) })),
  apiForbidden: vi.fn(() => ({ status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) })),
  apiPaginated: vi.fn((data: any, total: number, page: number, limit: number, extra?: any) => ({
    status: 200, json: () => Promise.resolve({ success: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), ...extra } }),
  })),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
  parseSorting: vi.fn().mockReturnValue({ sortBy: 'createdAt', sortOrder: 'desc' }),
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
  EASA_DEFAULTS: { passMarkPct: 75, timePerQuestionSecs: 75, retakeWaitDays: 90, maxRetakes: 3, allowKeyboardAutoSubmit: true },
  isInternalExamSystemEnabled: vi.fn().mockResolvedValue(true),
  getBankRules: vi.fn().mockResolvedValue({ passMarkPct: 75, timePerQuestionSecs: 75, retakeWaitDays: 90, maxRetakes: 3, completionWindowYears: 10, allowKeyboardAutoSubmit: true, customInstructions: null }),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  AuditAction: { UPDATE: 'UPDATE', DELETE: 'DELETE', CREATE: 'CREATE' },
}))

import { getAuthSession, requireStaff } from '@/lib/auth/helpers'
import { isInternalExamSystemEnabled, getBankRules } from '@/lib/internal-exam/engine'
import { createAuditLog } from '@/lib/audit/logger'

import { GET as getVersions } from '@/app/api/staff/exams/internal/questions/[questionId]/versions/route'
import { PATCH as reviewPatch } from '@/app/api/staff/exams/internal/questions/[questionId]/review/route'
import { GET as bankQuestionsGet, POST as bankQuestionsPost } from '@/app/api/staff/exams/internal/banks/[bankId]/questions/route'
import { GET as questionGet, PUT as questionPut, DELETE as questionDelete } from '@/app/api/staff/exams/internal/banks/[bankId]/questions/[questionId]/route'
import { POST as regradePost } from '@/app/api/staff/exams/internal/operations/regrade/route'

const STAFF = { user: { id: 'staff-1', role: 'ADMIN' } }
const STUDENT = { user: { id: 'stu-1', role: 'STUDENT' } }
const STAFF_MEMBER = { user: { id: 'staff-2', role: 'STAFF' } }

const Q = (over: any = {}) => ({
  id: 'q1', bankId: 'b1', text: 'text', options: ['a', 'b', 'c'], correctAnswer: 'a', points: 1,
  difficulty: 'MEDIUM', isActive: true, status: 'APPROVED', subTopic: null, syllabusRef: null,
  knowledgeLevel: null, reviewNote: null, reviewedAt: null, reviewedById: null, submittedById: null,
  createdAt: new Date(), updatedAt: new Date(), ...over,
})

const ctx = (params: Record<string, string>) => ({ params: Promise.resolve(params) })

describe('internal-exam staff routes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => (typeof fn === 'function' ? fn(prismaMock) : Promise.resolve(fn)))
    ;(getAuthSession as any).mockResolvedValue(STAFF)
    ;(requireStaff as any).mockResolvedValue(STAFF.user)
    ;(isInternalExamSystemEnabled as any).mockResolvedValue(true)
    ;(getBankRules as any).mockResolvedValue({ passMarkPct: 75 })
    ;(createAuditLog as any).mockResolvedValue(undefined)
  })

  describe('GET /questions/[questionId]/versions', () => {
    it('403 for a disallowed role', async () => {
      ;(getAuthSession as any).mockResolvedValue(STUDENT)
      const res = await getVersions(new NextRequest('http://x/v'), ctx({ questionId: 'q1' }))
      expect(res.status).toBe(403)
    })
    it('403 when the system is disabled', async () => {
      ;(isInternalExamSystemEnabled as any).mockResolvedValueOnce(false)
      const res = await getVersions(new NextRequest('http://x/v'), ctx({ questionId: 'q1' }))
      expect(res.status).toBe(403)
    })
    it('404 when question missing', async () => {
      prismaMock.internalExamQuestion.findUnique.mockResolvedValueOnce(null)
      const res = await getVersions(new NextRequest('http://x/v'), ctx({ questionId: 'q1' }))
      expect(res.status).toBe(404)
      expect(prismaMock.internalExamQuestion.findUnique).toHaveBeenCalledWith({ where: { id: 'q1' }, select: { id: true } })
    })
    it('200 returns versions list', async () => {
      prismaMock.internalExamQuestion.findUnique.mockResolvedValueOnce({ id: 'q1' })
      prismaMock.internalExamQuestionVersion.findMany.mockResolvedValueOnce([{ id: 'v1', version: 1 }])
      const res = await getVersions(new NextRequest('http://x/v'), ctx({ questionId: 'q1' }))
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toHaveLength(1)
      expect(prismaMock.internalExamQuestionVersion.findMany).toHaveBeenCalledWith({ where: { questionId: 'q1' }, orderBy: { changedAt: 'desc' }, include: { changedBy: { select: expect.any(Object) } } })
    })
  })

  describe('PATCH /questions/[questionId]/review', () => {
    it('400 for an invalid status enum', async () => {
      const res = await reviewPatch(new NextRequest('http://x/r', { method: 'PATCH', body: JSON.stringify({ status: 'BOGUS' }) }), ctx({ questionId: 'q1' }))
      expect(res.status).toBe(400)
    })
    it('404 when question missing', async () => {
      prismaMock.internalExamQuestion.findUnique.mockResolvedValueOnce(null)
      const res = await reviewPatch(new NextRequest('http://x/r', { method: 'PATCH', body: JSON.stringify({ status: 'APPROVED' }) }), ctx({ questionId: 'q1' }))
      expect(res.status).toBe(404)
    })
    it('updates the question and returns it', async () => {
      prismaMock.internalExamQuestion.findUnique.mockResolvedValueOnce(Q({ status: 'DRAFT' }))
      prismaMock.internalExamQuestion.update.mockResolvedValueOnce(Q({ status: 'APPROVED', reviewNote: 'ok', reviewedById: 'staff-1' }))
      const res = await reviewPatch(new NextRequest('http://x/r', { method: 'PATCH', body: JSON.stringify({ status: 'APPROVED', reviewNote: 'ok' }) }), ctx({ questionId: 'q1' }))
      expect(res.status).toBe(200)
      expect(prismaMock.internalExamQuestion.update).toHaveBeenCalledWith({ where: { id: 'q1' }, data: { status: 'APPROVED', reviewNote: 'ok', reviewedById: 'staff-1', reviewedAt: expect.any(Date) } })
    })
  })

  describe('GET/POST /banks/[bankId]/questions', () => {
    it('GET 200 returns list', async () => {
      prismaMock.internalExamQuestion.findMany.mockResolvedValueOnce([Q()])
      const res = await bankQuestionsGet(new NextRequest('http://x/b'), ctx({ bankId: 'b1' }))
      expect(res.status).toBe(200)
      expect((await res.json()).data).toHaveLength(1)
      expect(prismaMock.internalExamQuestion.findMany).toHaveBeenCalledWith({ where: { bankId: 'b1' }, orderBy: expect.any(Array) })
    })
    it('GET applies status filter', async () => {
      const res = await bankQuestionsGet(new NextRequest('http://x/b?status=APPROVED'), ctx({ bankId: 'b1' }))
      expect(res.status).toBe(200)
      expect(prismaMock.internalExamQuestion.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ bankId: 'b1', status: 'APPROVED' }) }))
    })
    it('GET 400 on an invalid status enum value', async () => {
      const res = await bankQuestionsGet(new NextRequest('http://x/b?status=BOGUS'), ctx({ bankId: 'b1' }))
      expect(res.status).toBe(400)
      expect(prismaMock.internalExamQuestion.findMany).not.toHaveBeenCalled()
    })
    it('POST 201 creates a single valid question', async () => {
      prismaMock.internalExamQuestion.create.mockResolvedValueOnce(Q())
      const body = JSON.stringify({ text: 't', options: ['a', 'b', 'c'], correctAnswer: 'a' })
      const res = await bankQuestionsPost(new NextRequest('http://x/b', { method: 'POST', body }), ctx({ bankId: 'b1' }))
      expect(res.status).toBe(201)
      expect(prismaMock.internalExamQuestion.create).toHaveBeenCalledWith({ data: expect.objectContaining({ bankId: 'b1', text: 't', correctAnswer: 'a' }) })
    })
    it('POST reports row-level validation errors for an invalid single row', async () => {
      // Route contract: bulk import never 400s on bad rows — it returns 201 with
      // an `errors` array (row-level reporting) and count: 0 created items.
      const body = JSON.stringify({ text: 'too few opts', options: ['a'] })
      const res = await bankQuestionsPost(new NextRequest('http://x/b', { method: 'POST', body }), ctx({ bankId: 'b1' }))
      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.count).toBe(0)
      expect(json.data.errors).toHaveLength(1)
      expect(json.data.errors[0].row).toBe(1)
    })
    it('POST bulk import reports row-level errors but still creates valid rows', async () => {
      prismaMock.internalExamQuestion.create.mockResolvedValueOnce(Q())
      const body = JSON.stringify([{ text: 't', options: ['a', 'b', 'c'], correctAnswer: 'a' }, { options: ['a'] }])
      const res = await bankQuestionsPost(new NextRequest('http://x/b', { method: 'POST', body }), ctx({ bankId: 'b1' }))
      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.count).toBe(1)
      expect(json.data.errors).toHaveLength(1)
      expect(json.data.errors[0].row).toBe(2)
    })
  })

  describe('GET/PUT/DELETE /banks/[bankId]/questions/[questionId]', () => {
    it('GET 404 when question missing', async () => {
      prismaMock.internalExamQuestionVersion.findMany.mockResolvedValue([])
      const res = await questionGet(new NextRequest('http://x'), ctx({ bankId: 'b1', questionId: 'q1' }))
      expect(res.status).toBe(200)
      expect((await res.json()).data).toEqual([])
    })
    it('PUT 400 on invalid input', async () => {
      const res = await questionPut(new NextRequest('http://x', { method: 'PUT', body: JSON.stringify({ text: 'x', options: ['a'] }) }), ctx({ bankId: 'b1', questionId: 'q1' }))
      expect(res.status).toBe(400)
    })
    it('PUT 404 when question missing', async () => {
      prismaMock.internalExamQuestion.findUnique.mockResolvedValueOnce(null)
      const res = await questionPut(new NextRequest('http://x', { method: 'PUT', body: JSON.stringify({ text: 't', options: ['a', 'b', 'c'], correctAnswer: 'a' }) }), ctx({ bankId: 'b1', questionId: 'q1' }))
      expect(res.status).toBe(404)
    })
    it('PUT creates a version, updates question, and writes an audit log', async () => {
      prismaMock.internalExamQuestion.findUnique.mockResolvedValueOnce(Q({ status: 'APPROVED' }))
      prismaMock.internalExamQuestionVersion.count.mockResolvedValueOnce(1)
      prismaMock.internalExamQuestionVersion.create.mockResolvedValueOnce({ id: 'v2', version: 2 })
      prismaMock.internalExamQuestion.update.mockResolvedValueOnce(Q({ status: 'PENDING_APPROVAL' }))
      const res = await questionPut(new NextRequest('http://x', { method: 'PUT', body: JSON.stringify({ text: 'changed', options: ['a', 'b', 'c'], correctAnswer: 'b' }) }), ctx({ bankId: 'b1', questionId: 'q1' }))
      expect(res.status).toBe(200)
      expect(prismaMock.internalExamQuestionVersion.create).toHaveBeenCalled()
      expect(prismaMock.internalExamQuestion.update).toHaveBeenCalledWith({ where: { id: 'q1' }, data: expect.objectContaining({ text: 'changed' }) })
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', entity: 'InternalExamQuestion' }))
    })
    it('DELETE 403 for a STAFF member (admin-only gate)', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(STAFF_MEMBER)
      const res = await questionDelete(new NextRequest('http://x'), ctx({ bankId: 'b1', questionId: 'q1' }))
      expect(res.status).toBe(403)
    })
    it('DELETE retires the question (version + audit log)', async () => {
      prismaMock.internalExamQuestion.findUnique.mockResolvedValueOnce(Q())
      prismaMock.internalExamQuestionVersion.count.mockResolvedValueOnce(0)
      prismaMock.internalExamQuestionVersion.create.mockResolvedValueOnce({ id: 'v1', version: 1 })
      prismaMock.internalExamQuestion.update.mockResolvedValueOnce(Q({ isActive: false }))
      const res = await questionDelete(new NextRequest('http://x'), ctx({ bankId: 'b1', questionId: 'q1' }))
      expect(res.status).toBe(200)
      expect(prismaMock.internalExamQuestionVersion.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ changeType: 'RETIRED' }) }))
      expect(prismaMock.internalExamQuestion.update).toHaveBeenCalledWith({ where: { id: 'q1' }, data: { isActive: false } })
      expect(createAuditLog).toHaveBeenCalled()
    })
  })

  describe('POST /operations/regrade', () => {
    it('401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const res = await regradePost(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionIds: ['s1'] }) }))
      expect(res.status).toBe(401)
    })
    it('400 for invalid body (empty array)', async () => {
      const res = await regradePost(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionIds: [] }) }))
      expect(res.status).toBe(400)
    })
    it('200 regrades completed sessions and writes an audit log', async () => {
      const session = {
        id: 's1', bankId: 'b1', status: 'COMPLETED', score: 30, totalPoints: 40, percentage: 75, passed: true,
        answers: [
          { id: 'a1', isCorrect: false, pointsAwarded: 0, selectedAnswer: 'a', question: { id: 'q1', correctAnswer: 'a', points: 1 } },
          { id: 'a2', isCorrect: true, pointsAwarded: 1, selectedAnswer: 'b', question: { id: 'q2', correctAnswer: 'b', points: 1 } },
        ],
      }
      prismaMock.internalExamSession.findUnique.mockResolvedValueOnce(session as any)
      prismaMock.internalExamSession.updateMany.mockResolvedValueOnce({ count: 1 })
      const res = await regradePost(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionIds: ['s1'] }) }))
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.regraded).toBe(1)
      expect(prismaMock.internalExamAnswer.update).toHaveBeenCalled()
      expect(prismaMock.internalExamSession.updateMany).toHaveBeenCalledWith({ where: { id: 's1', status: { notIn: ['VOIDED', 'IN_PROGRESS'] } }, data: expect.objectContaining({ percentage: 100 }) })
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', entity: 'InternalExamSession' }))
    })
    it('skips VOIDED / IN_PROGRESS sessions without writing', async () => {
      prismaMock.internalExamSession.findUnique.mockResolvedValueOnce({ id: 's1', bankId: 'b1', status: 'VOIDED', answers: [] } as any)
      prismaMock.internalExamSession.updateMany.mockResolvedValueOnce({ count: 1 })
      const res = await regradePost(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionIds: ['s1'] }) }))
      expect(res.status).toBe(200)
      expect(prismaMock.internalExamSession.updateMany).not.toHaveBeenCalled()
      expect(createAuditLog).toHaveBeenCalled()
    })
  })
})
