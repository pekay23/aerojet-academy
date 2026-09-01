import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  PERMISSIONS: { APPROVE_PAYMENTS: 'approve_payments' },
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {},
}))

import { PATCH } from '@/app/api/staff/referrals/payouts/[id]/route'
import { createAuditLog } from '@/lib/audit/logger'

function makeRequest(body: Record<string, any>) {
  return new NextRequest('http://localhost/api/staff/referrals/payouts/pay-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/staff/referrals/payouts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('approves a pending payout', async () => {
    prismaMock.referralPayout.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      status: 'PENDING',
      approvedById: null,
      paidAt: null,
      notes: null,
    } as any)
    prismaMock.referralPayout.update.mockResolvedValueOnce({
      id: 'pay-1',
      status: 'APPROVED',
    } as any)

    const req = makeRequest({ status: 'APPROVED' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'pay-1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(prismaMock.referralPayout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay-1' },
        data: expect.objectContaining({ status: 'APPROVED', approvedById: 'staff-1' }),
      })
    )
    expect(createAuditLog).toHaveBeenCalled()
  })

  it('returns 404 when payout not found', async () => {
    prismaMock.referralPayout.findUnique.mockResolvedValueOnce(null)
    const req = makeRequest({ status: 'APPROVED' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'pay-999' }) })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid status transition', async () => {
    prismaMock.referralPayout.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      status: 'PAID',
      approvedById: 'staff-1',
      paidAt: new Date(),
      notes: null,
    } as any)

    const req = makeRequest({ status: 'APPROVED' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'pay-1' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Cannot move')
  })

  it('marks payout as PAID', async () => {
    prismaMock.referralPayout.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      status: 'APPROVED',
      approvedById: 'staff-1',
      paidAt: null,
      notes: null,
    } as any)
    prismaMock.referralPayout.update.mockResolvedValueOnce({
      id: 'pay-1',
      status: 'PAID',
      paidAt: new Date(),
    } as any)

    const req = makeRequest({ status: 'PAID' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'pay-1' }) })
    expect(res.status).toBe(200)
    expect(prismaMock.referralPayout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PAID', paidAt: expect.any(Date) }),
      })
    )
  })
})
