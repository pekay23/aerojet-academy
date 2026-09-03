import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

const { mockConstructEvent } = vi.hoisted(() => ({ mockConstructEvent: vi.fn() }))

vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEvent: mockConstructEvent }
  },
  __esModule: true,
}))

vi.mock('@/lib/wallet/operations', () => ({
  topUpWallet: vi.fn().mockResolvedValue({ id: 'wallet-1' }),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn().mockResolvedValue({ id: 'audit-1' }),
  AuditAction: {},
  queryAuditLogs: vi.fn(),
}))

import { POST } from '@/app/api/webhooks/stripe/route'
import { topUpWallet } from '@/lib/wallet/operations'
import { createAuditLog } from '@/lib/audit/logger'

const ENV_KEYS = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
const originalEnv: Record<string, string | undefined> = {}

function saveEnv() {
  ENV_KEYS.forEach((k) => {
    originalEnv[k] = process.env[k]
  })
}

function restoreEnv() {
  ENV_KEYS.forEach((k) => {
    if (originalEnv[k] === undefined) delete process.env[k]
    else process.env[k] = originalEnv[k]
  })
}

function setEnv(values: Record<string, string | undefined>) {
  ENV_KEYS.forEach((k) => {
    const v = values[k]
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  })
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConstructEvent.mockReset()
    prismaMock.$transaction.mockImplementation((fn: any) => {
      if (typeof fn === 'function') return fn(prismaMock)
      return Promise.resolve(fn)
    })
    saveEnv()
    setEnv({ STRIPE_SECRET_KEY: undefined, STRIPE_WEBHOOK_SECRET: undefined })
  })

  afterEach(() => {
    restoreEnv()
  })

  describe('POST', () => {
    it('returns 503 when Stripe integration is not configured', async () => {
      setEnv({ STRIPE_SECRET_KEY: undefined, STRIPE_WEBHOOK_SECRET: undefined })
      const req = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(503)
      expect(await res.json()).toEqual({ error: 'Stripe integration not configured' })
    })

    it('returns 400 when stripe-signature header is missing', async () => {
      setEnv({ STRIPE_SECRET_KEY: 'sk_test', STRIPE_WEBHOOK_SECRET: 'whsec_test' })
      const req = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: 'Missing stripe-signature header' })
    })

    it('returns 401 when signature verification fails', async () => {
      setEnv({ STRIPE_SECRET_KEY: 'sk_test', STRIPE_WEBHOOK_SECRET: 'whsec_test' })
      mockConstructEvent.mockImplementationOnce(() => {
        throw new Error('No signatures found matching the expected signature')
      })
      const req = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'bad-sig' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Invalid signature' })
    })

    it('returns 200 and processes payment_intent.succeeded', async () => {
      setEnv({ STRIPE_SECRET_KEY: 'sk_test', STRIPE_WEBHOOK_SECRET: 'whsec_test' })
      mockConstructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            amount: 1000,
            metadata: {
              userId: 'user-1',
              paymentType: 'WALLET_TOP_UP',
              paymentId: 'pay-1',
            },
          },
        },
      })
      prismaMock.payment.findUnique.mockResolvedValue({ id: 'pay-1', status: 'PENDING' } as any)
      prismaMock.payment.update.mockResolvedValue({ id: 'pay-1', status: 'APPROVED' } as any)

      const req = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ received: true })
      expect(prismaMock.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-1' },
          data: expect.objectContaining({ status: 'APPROVED', approvedBy: 'STRIPE' }),
        })
      )
      expect(topUpWallet).toHaveBeenCalledWith(
        prismaMock,
        'user-1',
        10,
        'Stripe payment pi_123',
        'pay-1',
        'PAYMENT_ID'
      )
      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_APPROVE',
          entity: 'Payment',
          entityId: 'pay-1',
          userId: 'user-1',
        })
      )
    })

    it('returns 200 for an unhandled event type', async () => {
      setEnv({ STRIPE_SECRET_KEY: 'sk_test', STRIPE_WEBHOOK_SECRET: 'whsec_test' })
      mockConstructEvent.mockReturnValue({
        type: 'customer.deleted',
        data: { object: {} },
      })
      const req = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ received: true })
    })
  })
})
