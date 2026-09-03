import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  PERMISSIONS: { APPROVE_PAYMENTS: 'approve_payments' },
}))

vi.mock('@/lib/gdpr/anonymise', () => ({
  anonymiseUser: vi.fn().mockResolvedValue({ anonymised: true, userId: 'user-1' }),
}))

import { POST } from '@/app/api/staff/users/[id]/anonymise/route'
import { anonymiseUser } from '@/lib/gdpr/anonymise'

function makeRequest(body: Record<string, any>) {
  return new NextRequest('http://localhost/api/staff/users/user-1/anonymise', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/staff/users/[id]/anonymise', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('anonymises user with valid payload', async () => {
    const req = makeRequest({ reason: 'User requested deletion', confirmEmail: 'user@example.com' })
    const res = await POST(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(anonymiseUser).toHaveBeenCalledWith(
      'user-1',
      'staff-1',
      'User requested deletion (confirmed via user@example.com)'
    )
  })

  it('returns 500 when reason is too short (Zod validation)', async () => {
    const req = makeRequest({ reason: 'no', confirmEmail: 'user@example.com' })
    const res = await POST(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(500)
  })

  it('returns 500 when confirmEmail is invalid (Zod validation)', async () => {
    const req = makeRequest({ reason: 'Valid reason here', confirmEmail: 'not-an-email' })
    const res = await POST(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(500)
  })

  it('returns 500 when body is empty (Zod validation)', async () => {
    const req = makeRequest({})
    const res = await POST(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(500)
  })
})
