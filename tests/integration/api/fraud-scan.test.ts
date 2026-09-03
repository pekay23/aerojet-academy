import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  PERMISSIONS: { APPROVE_PAYMENTS: 'approve_payments' },
}))

vi.mock('@/lib/referral/admin', () => ({
  runFraudHeuristics: vi.fn().mockResolvedValue({ scanned: 100, flagged: 3 }),
}))

import { POST } from '@/app/api/staff/referrals/fraud-scan/route'
import { runFraudHeuristics } from '@/lib/referral/admin'

function makeRequest() {
  return new NextRequest('http://localhost/api/staff/referrals/fraud-scan', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

describe('POST /api/staff/referrals/fraud-scan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runs fraud scan and returns results', async () => {
    const req = makeRequest()
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.scanned).toBe(100)
    expect(json.data.flagged).toBe(3)
    expect(runFraudHeuristics).toHaveBeenCalledWith(30)
  })

  it('returns 200 with zero results when no referrals', async () => {
    ;(runFraudHeuristics as any).mockResolvedValueOnce({ scanned: 0, flagged: 0 })
    const req = makeRequest()
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.scanned).toBe(0)
    expect(json.data.flagged).toBe(0)
  })

  it('handles errors gracefully', async () => {
    ;(runFraudHeuristics as any).mockRejectedValueOnce(new Error('DB error'))
    const req = makeRequest()
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
