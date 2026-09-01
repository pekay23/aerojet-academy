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
  withErrorHandler: vi.fn((fn: any) => {
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

vi.mock('@/lib/internal-exam/engine', () => ({
  isInternalExamSystemEnabled: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: { UPDATE: 'UPDATE', CREATE: 'CREATE', DELETE: 'DELETE' },
  queryAuditLogs: vi.fn(),
}))

import { GET, PUT, DELETE } from '@/app/api/staff/exams/internal/banks/[bankId]/questions/[questionId]/route.ts'
import { getAuthSession } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'
import { createAuditLog } from '@/lib/audit/logger'

describe('/staff/exams/internal/banks/:bankId/questions/:questionId', () => {
  beforeEach(() => {
    getAuthSession.mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } })
    prismaMock.internalExamQuestionVersion.count.mockResolvedValue(0)
    prismaMock.internalExamQuestionVersion.findMany.mockResolvedValue([])
    prismaMock.internalExamQuestion.findUnique.mockResolvedValue(null as any)
    prismaMock.internalExamQuestion.update.mockResolvedValue({} as any)
    prismaMock.internalExamQuestionVersion.create.mockResolvedValue({} as any)
  })

  it('returns 200 with versions', async () => {
    prismaMock.internalExamQuestionVersion.findMany.mockResolvedValue([
      { id: 'v1', version: 1, text: 'Q1', changeType: 'CREATED', changedAt: new Date(), changer: null }
    ] as any)
    const req = new NextRequest('http://localhost/staff/exams/internal/banks/b1/questions/q1/versions')
    const res = await GET(req, { params: Promise.resolve({ bankId: 'b1', questionId: 'q1' }) } as any)
    expect(res.status).toBe(200)
  })

  it('returns 404 when question not found on PUT', async () => {
    prismaMock.internalExamQuestion.findUnique.mockResolvedValue(null as any)
    const req = new NextRequest('http://localhost/staff/exams/internal/banks/b1/questions/q1', {
      method: 'PUT',
      body: JSON.stringify({ text: 'New text', options: ['A', 'B', 'C'], correctAnswer: 'A' }),
    })
    const res = await PUT(req, { params: Promise.resolve({ bankId: 'b1', questionId: 'q1' }) } as any)
    expect(res.status).toBe(404)
  })

  it('creates version snapshot on PUT', async () => {
    prismaMock.internalExamQuestion.findUnique.mockResolvedValue({
      id: 'q1', bankId: 'b1', text: 'Old', options: ['A', 'B', 'C'], correctAnswer: 'A',
      subTopic: null, difficulty: 'MEDIUM', points: 1, syllabusRef: null, knowledgeLevel: null, isActive: true,
    } as any)
    prismaMock.internalExamQuestionVersion.create.mockResolvedValue({ id: 'v1' } as any)
    prismaMock.internalExamQuestion.update.mockResolvedValue({ id: 'q1', text: 'New' } as any)

    const req = new NextRequest('http://localhost/staff/exams/internal/banks/b1/questions/q1', {
      method: 'PUT',
      body: JSON.stringify({ text: 'New text', options: ['A', 'B', 'C'], correctAnswer: 'A' }),
    })
    const res = await PUT(req, { params: Promise.resolve({ bankId: 'b1', questionId: 'q1' }) } as any)
    expect(res.status).toBe(200)
    expect(prismaMock.internalExamQuestionVersion.create).toHaveBeenCalled()
    expect(createAuditLog).toHaveBeenCalled()
  })

  it('retires question on DELETE', async () => {
    prismaMock.internalExamQuestion.findUnique.mockResolvedValue({
      id: 'q1', bankId: 'b1', text: 'Q1', options: ['A', 'B', 'C'], correctAnswer: 'A',
      subTopic: null, difficulty: 'MEDIUM', points: 1, syllabusRef: null, knowledgeLevel: null, isActive: true,
    } as any)
    prismaMock.internalExamQuestion.update.mockResolvedValue({ id: 'q1', isActive: false } as any)

    const req = new NextRequest('http://localhost/staff/exams/internal/banks/b1/questions/q1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ bankId: 'b1', questionId: 'q1' }) } as any)
    expect(res.status).toBe(200)
  })
})
