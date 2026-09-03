import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api/response', () => ({
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
  apiError: vi.fn((message: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ message, error: message }),
  })),
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
}))

vi.mock('@/lib/analytics/queries', () => ({
  getFunnelMetrics: vi.fn(),
}))

import { GET } from '@/app/api/staff/analytics/funnels/route'
import { getFunnelMetrics } from '@/lib/analytics/queries'

describe('GET /api/staff/analytics/funnels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid funnel name', async () => {
    const req = new Request('http://localhost/api/staff/analytics/funnels?funnel=invalid')
    const res = await GET(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid funnel name. Use: registration, enrollment, exam, payment')
  })

  it('returns funnel metrics for valid funnel', async () => {
    ;(getFunnelMetrics as any).mockResolvedValue({ steps: [{ name: 'start', count: 100 }] })
    const req = new Request('http://localhost/api/staff/analytics/funnels?funnel=registration')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ steps: [{ name: 'start', count: 100 }] })
  })

  it('passes from/to params to query', async () => {
    ;(getFunnelMetrics as any).mockResolvedValue({ steps: [] })
    const req = new Request(
      'http://localhost/api/staff/analytics/funnels?funnel=enrollment&from=2024-01-01&to=2024-12-31'
    )
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(getFunnelMetrics).toHaveBeenCalledWith(
      'enrollment',
      new Date('2024-01-01'),
      new Date('2024-12-31')
    )
  })
})
