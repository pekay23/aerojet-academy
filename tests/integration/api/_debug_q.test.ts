import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi
    .fn()
    .mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } }),
  requireStaff: vi.fn(),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiCreated: vi.fn((data: any) => ({ status: 201, json: () => Promise.resolve(data) })),
  apiError: vi.fn((msg: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ error: msg }),
  })),
  withErrorHandler: vi.fn((fn: any) => {
    return async (req: any, ctx: any) => {
      try {
        const resolvedCtx = ctx?.params ? { ...ctx, params: await ctx.params } : ctx
        return await fn(req, resolvedCtx)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Unauthorized') return { status: 401, json: () => Promise.resolve({}) }
        if (message === 'Forbidden') return { status: 403, json: () => Promise.resolve({}) }
        return { status: 500, json: () => Promise.resolve({}) }
      }
    }
  }),
}))

vi.mock('@/lib/internal-exam/engine', () => ({
  isInternalExamSystemEnabled: vi.fn().mockResolvedValue(true),
}))

import { GET } from '@/app/api/staff/exams/internal/banks/[bankId]/questions/route'
import { getAuthSession } from '@/lib/auth/helpers'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

describe('debug', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(getAuthSession as any).mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' },
    })
    prismaMock.internalExamQuestion.findUnique.mockResolvedValue(null as any)
  })
  it('debug', async () => {
    const s = await (getAuthSession as any)()
    console.log('SESSION:', JSON.stringify(s))
    console.log('ENABLED:', await (isInternalExamSystemEnabled as any)())
    const req = new NextRequest('http://localhost/staff/exams/internal/banks/b1/questions')
    const res = await GET(req, { params: Promise.resolve({ bankId: 'b1' }) } as any)
    console.log('STATUS:', res.status)
    expect(res.status).toBe(200)
  })
})
