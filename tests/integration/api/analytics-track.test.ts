import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/analytics/events', () => ({
  trackSearch: vi.fn().mockResolvedValue(undefined),
  trackDocumentUpload: vi.fn().mockResolvedValue(undefined),
  trackPageView: vi.fn().mockResolvedValue(undefined),
  trackFeatureUsage: vi.fn().mockResolvedValue(undefined),
  trackReferralClick: vi.fn().mockResolvedValue(undefined),
  trackEvent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ message, error: message }),
  })),
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

import { POST } from '@/app/api/analytics/track/route'

describe('POST /api/analytics/track', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
  })

  describe('POST', () => {
    it('returns 400 for invalid input (missing event)', async () => {
      const req = new NextRequest('http://localhost/api/analytics/track', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 for invalid event type', async () => {
      const req = new NextRequest('http://localhost/api/analytics/track', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ invalid: 'data' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 200 for valid PAGE_VIEW event', async () => {
      const req = new NextRequest('http://localhost/api/analytics/track', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ event: 'PAGE_VIEW', data: { path: '/test' } }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
    })

    it('returns 200 for valid SEARCH_PERFORMED event', async () => {
      const req = new NextRequest('http://localhost/api/analytics/track', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ event: 'SEARCH_PERFORMED', data: { query: 'test' } }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
    })
  })
})
