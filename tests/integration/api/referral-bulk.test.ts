import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  PERMISSIONS: { APPROVE_PAYMENTS: 'approve_payments' },
}))

vi.mock('@/lib/referral/admin', () => ({
  disqualifyReferral: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/staff/referrals/bulk/route'
import { disqualifyReferral } from '@/lib/referral/admin'

function makeRequest(body: Record<string, any>) {
  return new NextRequest('http://localhost/api/staff/referrals/bulk', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/staff/referrals/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('disqualifies multiple referrals', async () => {
    const req = makeRequest({
      action: 'disqualify',
      ids: ['ref-1', 'ref-2', 'ref-3'],
      reason: 'Fraud detected',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.processed).toBe(3)
    expect(json.data.failed).toBe(0)
    expect(disqualifyReferral).toHaveBeenCalledTimes(3)
  })

  it('returns 500 for unknown action (Zod enum validation)', async () => {
    const req = makeRequest({ action: 'unknown', ids: ['ref-1'], reason: 'test' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 500 when ids array is empty (Zod validation)', async () => {
    const req = makeRequest({ action: 'disqualify', ids: [], reason: 'test' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 500 when reason is too short (Zod validation)', async () => {
    const req = makeRequest({ action: 'disqualify', ids: ['ref-1'], reason: 'x' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('reports partial failures', async () => {
    ;(disqualifyReferral as any)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Not found'))
    const req = makeRequest({ action: 'disqualify', ids: ['ref-1', 'ref-2'], reason: 'Fraud' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.processed).toBe(1)
    expect(json.data.failed).toBe(1)
  })
})
