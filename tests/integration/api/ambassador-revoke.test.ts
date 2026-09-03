import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  PERMISSIONS: { APPROVE_PAYMENTS: 'approve_payments' },
}))

vi.mock('@/lib/referral/admin', () => ({
  revokeAmbassador: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/staff/referrals/ambassador/[userId]/revoke/route'
import { revokeAmbassador } from '@/lib/referral/admin'

function makeRequest(body: Record<string, any>) {
  return new NextRequest('http://localhost/api/staff/referrals/ambassador/user-1/revoke', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/staff/referrals/ambassador/[userId]/revoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revokes ambassador status', async () => {
    const req = makeRequest({ reason: 'Violation of terms' })
    const res = await POST(req, { params: Promise.resolve({ userId: 'user-1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.revoked).toBe(true)
    expect(revokeAmbassador).toHaveBeenCalledWith('user-1', 'staff-1', 'Violation of terms')
  })

  it('returns 500 when reason is too short (Zod validation)', async () => {
    const req = makeRequest({ reason: 'x' })
    const res = await POST(req, { params: Promise.resolve({ userId: 'user-1' }) })
    expect(res.status).toBe(500)
  })

  it('returns 500 when reason is missing (Zod validation)', async () => {
    const req = makeRequest({})
    const res = await POST(req, { params: Promise.resolve({ userId: 'user-1' }) })
    expect(res.status).toBe(500)
  })

  it('returns 500 when revoke fails', async () => {
    ;(revokeAmbassador as any).mockRejectedValueOnce(new Error('User not ambassador'))
    const req = makeRequest({ reason: 'Valid reason here' })
    const res = await POST(req, { params: Promise.resolve({ userId: 'user-1' }) })
    expect(res.status).toBe(500)
  })
})
