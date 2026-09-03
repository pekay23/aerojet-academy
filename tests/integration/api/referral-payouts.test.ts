import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  PERMISSIONS: { APPROVE_PAYMENTS: 'approve_payments' },
}))

vi.mock('@/lib/referral/admin', () => ({
  createPayoutRun: vi.fn().mockResolvedValue({ id: 'payout-run-1', count: 5 }),
}))

import { POST } from '@/app/api/staff/referrals/payouts/route'
import { createPayoutRun } from '@/lib/referral/admin'

function makeRequest(body: Record<string, any>) {
  return new NextRequest('http://localhost/api/staff/referrals/payouts', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/staff/referrals/payouts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates payout run with valid period', async () => {
    const req = makeRequest({ periodStart: '2025-01-01', periodEnd: '2025-01-31' })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(createPayoutRun).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      'staff-1'
    )
  })

  it('returns 400 when periodStart is after periodEnd', async () => {
    const req = makeRequest({ periodStart: '2025-12-31', periodEnd: '2025-01-01' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid date format', async () => {
    const req = makeRequest({ periodStart: 'not-a-date', periodEnd: '2025-01-31' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 when fields are missing (Zod validation)', async () => {
    const req = makeRequest({ periodStart: '2025-01-01' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
