import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api/response', () => ({
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
  }),
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) }))
}))

vi.mock('@/lib/analytics/queries', () => ({
  getCohortRetention: vi.fn(),
}))

import { GET } from '@/app/api/staff/analytics/retention/route'
import { getCohortRetention } from '@/lib/analytics/queries'

describe('GET /api/staff/analytics/retention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns cohort retention data', async () => {
    ;(getCohortRetention as any).mockResolvedValue([{ cohort: '2024-01', rate: 0.85 }])
    const req = new Request('http://localhost/api/staff/analytics/retention')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ cohorts: [{ cohort: '2024-01', rate: 0.85 }] })
  })

  it('passes cohort date to query when provided', async () => {
    ;(getCohortRetention as any).mockResolvedValue([])
    const req = new Request('http://localhost/api/staff/analytics/retention?cohort=2024-01-01')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(getCohortRetention).toHaveBeenCalledWith(new Date('2024-01-01'))
  })

  it('returns empty cohorts when no data', async () => {
    ;(getCohortRetention as any).mockResolvedValue([])
    const req = new Request('http://localhost/api/staff/analytics/retention')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ cohorts: [] })
  })
})
