import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  logAuditEvent: vi.fn(),
  AuditAction: {},
  queryAuditLogs: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 4, resetAt: Date.now() + 3600000 })
}))

import { POST } from '@/app/api/unsubscribe/route'

describe('POST /api/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
  })

  describe('POST', () => {
    it('returns 400 when email is missing', async () => {
      const req = new NextRequest('http://localhost/api/unsubscribe', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 200 with uniform message when user not found', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/unsubscribe', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.message).toBeDefined()
    })

    it('returns 200 and unsubscribes user when found', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce({ id: 'user-1', email: 'test@example.com', marketingOptOut: false } as any)
      prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1' } as any)
      const req = new NextRequest('http://localhost/api/unsubscribe', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.message).toBeDefined()
    })

  })

})
