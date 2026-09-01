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
  getPageViews: vi.fn(),
}))

import { GET } from '@/app/api/staff/analytics/pageviews/route'
import { getPageViews } from '@/lib/analytics/queries'

describe('GET /api/staff/analytics/pageviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns pageview data', async () => {
    ;(getPageViews as any).mockResolvedValue([{ path: '/', views: 1000 }])
    const req = new Request('http://localhost/api/staff/analytics/pageviews')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ pages: [{ path: '/', views: 1000 }] })
  })

  it('passes from/to/limit params to query', async () => {
    ;(getPageViews as any).mockResolvedValue([])
    const req = new Request('http://localhost/api/staff/analytics/pageviews?from=2024-01-01&to=2024-12-31&limit=50')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(getPageViews).toHaveBeenCalledWith(new Date('2024-01-01'), new Date('2024-12-31'), 50)
  })

  it('uses default limit when not provided', async () => {
    ;(getPageViews as any).mockResolvedValue([])
    const req = new Request('http://localhost/api/staff/analytics/pageviews')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(getPageViews).toHaveBeenCalledWith(undefined, undefined, 20)
  })
})
