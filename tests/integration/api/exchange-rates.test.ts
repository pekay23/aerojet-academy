import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/currency-api', () => ({
  fetchExchangeRates: vi.fn().mockResolvedValue({ eur: 1, ghs: 12.5, usd: 1.08, gbp: 0.85 }),
  getMultiCurrencyValues: vi
    .fn()
    .mockResolvedValue({ eur: 100, ghs: 1250, usd: 108, rates: { eur: 1, ghs: 12.5, usd: 1.08 } }),
}))

import { GET } from '@/app/api/exchange-rates/route'

describe('GET /api/exchange-rates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
  })

  describe('GET', () => {
    it('returns exchange rates for default base (EUR)', async () => {
      const req = new NextRequest('http://localhost/api/exchange-rates', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.rates).toBeDefined()
    })

    it('returns specific rate when "to" param is provided', async () => {
      const req = new NextRequest('http://localhost/api/exchange-rates?to=USD', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.rate).toBeDefined()
    })

    it('returns multi-currency values when amount is provided', async () => {
      const req = new NextRequest('http://localhost/api/exchange-rates?amount=100', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.eur).toBeDefined()
    })

    it('returns 400 for invalid amount', async () => {
      const req = new NextRequest('http://localhost/api/exchange-rates?amount=invalid', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(400)
    })
  })
})
