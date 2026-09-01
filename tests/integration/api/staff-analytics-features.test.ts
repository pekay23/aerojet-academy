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
  apiError: vi.fn((message, status) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
  apiNotFound: vi.fn((message) => ({ status: 404, json: () => Promise.resolve({ message, error: message }) })),
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) }))
}))

vi.mock('@/lib/analytics/queries', () => ({
  getFeatureAdoption: vi.fn(),
}))

import { GET } from '@/app/api/staff/analytics/features/route'
import { getFeatureAdoption } from '@/lib/analytics/queries'

describe('GET /api/staff/analytics/features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when feature param is missing', async () => {
    const req = new Request('http://localhost/api/staff/analytics/features')
    const res = await GET(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing required parameter: feature')
  })

  it('returns 404 when no data found for feature', async () => {
    ;(getFeatureAdoption as any).mockResolvedValue(null)
    const req = new Request('http://localhost/api/staff/analytics/features?feature=export-reports')
    const res = await GET(req as any)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('No data found for this feature')
  })

  it('returns feature adoption data', async () => {
    ;(getFeatureAdoption as any).mockResolvedValue({ feature: 'export-reports', adoption: 0.75 })
    const req = new Request('http://localhost/api/staff/analytics/features?feature=export-reports')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ feature: 'export-reports', adoption: 0.75 })
  })
})
