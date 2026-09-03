import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/currency-api', () => ({
  fetchExchangeRates: vi.fn().mockResolvedValue({ eur: 1, ghs: 12.5, usd: 1.08, gbp: 0.85 }),
}))

import { GET } from '@/app/api/finance/rates/route'

describe('GET /api/finance/rates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
  })

  describe('GET', () => {
    it('returns exchange rates with sources', async () => {
      prismaMock.systemSetting.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/finance/rates', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.rates).toBeDefined()
      expect(json.sources).toBeDefined()
    })

    it('returns manual rates when system settings exist', async () => {
      prismaMock.systemSetting.findUnique
        .mockResolvedValueOnce({ key: 'exchange_rate_eur_ghs', value: '13.0' } as any)
        .mockResolvedValueOnce({ key: 'exchange_rate_eur_usd', value: '1.1' } as any)
      const req = new NextRequest('http://localhost/api/finance/rates', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.rates.GHS).toBe(13.0)
      expect(json.rates.USD).toBe(1.1)
    })
  })
})
