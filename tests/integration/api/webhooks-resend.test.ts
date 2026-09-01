import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

const { mockVerify } = vi.hoisted(() => ({ mockVerify: vi.fn() }))

vi.mock('svix', () => ({
  Webhook: class {
    verify = mockVerify
  },
}))

import { POST } from '@/app/api/webhooks/resend/route.ts'

const SECRET = 'RESEND_WEBHOOK_SECRET'
const originalSecret = process.env[SECRET]

function setSecret(value: string | undefined) {
  if (value === undefined) delete process.env[SECRET]
  else process.env[SECRET] = value
}

describe('POST /api/webhooks/resend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerify.mockReset()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    setSecret(originalSecret)
  })

  afterEach(() => {
    setSecret(originalSecret)
  })

  describe('POST', () => {
    it('returns 503 when RESEND_WEBHOOK_SECRET is not configured', async () => {
      setSecret(undefined)
      const req = new NextRequest('http://localhost/api/webhooks/resend', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(503)
      expect(await res.json()).toEqual({ error: 'Webhook verification not configured' })
    })

    it('returns 401 when svix signature headers are missing', async () => {
      setSecret('test-secret')
      const req = new NextRequest('http://localhost/api/webhooks/resend', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Missing webhook signature headers' })
    })

    it('returns 401 when signature verification fails', async () => {
      setSecret('test-secret')
      mockVerify.mockImplementationOnce(() => {
        throw new Error('Invalid signature')
      })
      const req = new NextRequest('http://localhost/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_1',
          'svix-timestamp': '123',
          'svix-signature': 'sig',
        },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Invalid signature' })
    })

    it('returns 400 when payload is missing type or data', async () => {
      setSecret('test-secret')
      mockVerify.mockReturnValue({ type: 'sent', data: null, created_at: '2024-01-01' })
      const req = new NextRequest('http://localhost/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_1',
          'svix-timestamp': '123',
          'svix-signature': 'sig',
        },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: 'Invalid payload' })
    })

    it('returns 200 and logs an audit event on a valid payload', async () => {
      setSecret('test-secret')
      mockVerify.mockReturnValue({
        type: 'sent',
        data: { email_id: 'email-1', to: 'user@test.com', subject: 'Hello' },
        created_at: '2024-01-01T00:00:00Z',
      })
      prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-1' } as any)
      const req = new NextRequest('http://localhost/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_1',
          'svix-timestamp': '123',
          'svix-signature': 'sig',
        },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ received: true })
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'EMAIL_SENT',
            entity: 'email',
            entityId: 'email-1',
          }),
        })
      )
    })
  })
})
