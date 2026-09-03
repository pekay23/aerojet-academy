import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
}))

vi.mock('@/lib/analytics/forecasting', () => ({
  getEnrollmentPipeline: vi.fn(),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiUnauthorized: vi
    .fn()
    .mockReturnValue({ status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }),
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

import { GET } from '@/app/api/staff/analytics/pipeline/route'
import { getAuthSession } from '@/lib/auth/helpers'
import { getEnrollmentPipeline } from '@/lib/analytics/forecasting'

describe('GET /api/staff/analytics/pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no session', async () => {
    ;(getAuthSession as any).mockResolvedValue(null)
    const req = new Request('http://localhost/api/staff/analytics/pipeline')
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 401 when role is not authorized', async () => {
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'user-1', role: 'STUDENT' } })
    const req = new Request('http://localhost/api/staff/analytics/pipeline')
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it('returns pipeline data for authorized user', async () => {
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
    ;(getEnrollmentPipeline as any).mockResolvedValue({ stages: [{ name: 'Applied', count: 150 }] })
    const req = new Request('http://localhost/api/staff/analytics/pipeline')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ stages: [{ name: 'Applied', count: 150 }] })
  })
})
