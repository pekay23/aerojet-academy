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
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
}))

vi.mock('@/lib/analytics/dashboard-alerts', () => ({
  getDashboardAlerts: vi.fn(),
}))

vi.mock('@/lib/analytics/metrics', () => ({
  getDashboardMetrics: vi.fn(),
}))

import { GET } from '@/app/api/staff/analytics/dashboard/route'
import { getDashboardAlerts } from '@/lib/analytics/dashboard-alerts'
import { getDashboardMetrics } from '@/lib/analytics/metrics'

describe('GET /api/staff/analytics/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns dashboard alerts and metrics', async () => {
    ;(getDashboardAlerts as any).mockResolvedValue([{ id: 'alert-1', message: 'High enrollment' }])
    ;(getDashboardMetrics as any).mockResolvedValue({ totalUsers: 500, activeUsers: 350 })
    const req = new Request('http://localhost/api/staff/analytics/dashboard')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({
      alerts: [{ id: 'alert-1', message: 'High enrollment' }],
      metrics: { totalUsers: 500, activeUsers: 350 },
    })
  })

  it('calls getDashboardMetrics with "mom"', async () => {
    ;(getDashboardAlerts as any).mockResolvedValue([])
    ;(getDashboardMetrics as any).mockResolvedValue({})
    const req = new Request('http://localhost/api/staff/analytics/dashboard')
    await GET(req as any)
    expect(getDashboardMetrics).toHaveBeenCalledWith('mom')
  })
})
