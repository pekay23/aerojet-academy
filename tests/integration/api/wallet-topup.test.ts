import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as approveWalletTopup } from '@/app/api/staff/wallet-topups/[id]/approve/route'
import { POST as rejectWalletTopup } from '@/app/api/staff/finance/wallet-topups/[id]/reject/route'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

// Mock auth helpers
vi.mock('@/lib/auth/helpers', () => ({
  requireStaff: vi.fn().mockResolvedValue({ id: 'staff-1', email: 'staff@test.com' }),
}))

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', email: 'staff@test.com' }),
  PERMISSIONS: { APPROVE_PAYMENTS: 'APPROVE_PAYMENTS' },
}))

// Mock other dependencies
vi.mock('@/lib/wallet/operations', () => ({
  topUpWallet: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/analytics/events', () => ({
  trackWalletTopUp: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn().mockResolvedValue({}),
  AuditAction: { WALLET_TOP_UP: 'WALLET_TOP_UP' },
}))

describe('Staff Wallet Top-up Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.notification.create.mockResolvedValue({})
  })

  describe('POST /api/staff/wallet-topups/[id]/approve', () => {
    it('approves a pending wallet top-up and credits wallet', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: 'PENDING',
        referenceType: 'WALLET_TOPUP',
        amount: 500,
        userId: 'user-1',
        user: { id: 'user-1', email: 'user@test.com' },
        currency: 'EUR',
        referenceCode: 'WTU-ABC123',
      })
      prismaMock.payment.update.mockResolvedValue({})

      const req = new NextRequest('http://localhost/api/staff/wallet-topups/pay-1/approve', {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' }),
      })

      const res = await approveWalletTopup(req, { params: Promise.resolve({ id: 'pay-1' }) })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.data.message).toContain('approved')
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      })
    })

    it('rejects a pending wallet top-up', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: 'PENDING',
        referenceType: 'WALLET_TOPUP',
        amount: 500,
        userId: 'user-1',
        user: { id: 'user-1', email: 'user@test.com' },
        currency: 'EUR',
        referenceCode: 'WTU-ABC123',
      })
      prismaMock.payment.update.mockResolvedValue({})

      const req = new NextRequest('http://localhost/api/staff/wallet-topups/pay-1/approve', {
        method: 'POST',
        body: JSON.stringify({ action: 'reject', reason: 'Invalid proof' }),
      })

      const res = await approveWalletTopup(req, { params: Promise.resolve({ id: 'pay-1' }) })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.data.message).toBe('Top-up rejected')
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: expect.objectContaining({ status: 'REJECTED' }),
      })
    })

    it('returns 404 when payment is not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null)

      const req = new NextRequest('http://localhost/api/staff/wallet-topups/pay-1/approve', {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' }),
      })

      const res = await approveWalletTopup(req, { params: Promise.resolve({ id: 'pay-1' }) })

      expect(res.status).toBe(404)
    })

    it('returns error when payment is not pending', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: 'APPROVED',
        referenceType: 'WALLET_TOPUP',
      })

      const req = new NextRequest('http://localhost/api/staff/wallet-topups/pay-1/approve', {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' }),
      })

      const res = await approveWalletTopup(req, { params: Promise.resolve({ id: 'pay-1' }) })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/staff/finance/wallet-topups/[id]/reject', () => {
    it('rejects a pending wallet top-up with reason', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: 'PENDING',
        referenceType: 'WALLET_TOPUP',
        amount: 500,
        userId: 'user-1',
      })
      prismaMock.payment.update.mockResolvedValue({ count: 1 })
      prismaMock.auditLog.create.mockResolvedValue({})

      const req = new NextRequest('http://localhost/api/staff/finance/wallet-topups/pay-1/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Insufficient proof' }),
      })

      const res = await rejectWalletTopup(req, { params: Promise.resolve({ id: 'pay-1' }) })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: expect.objectContaining({
          status: 'REJECTED',
          rejectionReason: 'Insufficient proof',
        }),
      })
    })

    it('returns 400 when reason is missing', async () => {
      const req = new NextRequest('http://localhost/api/staff/finance/wallet-topups/pay-1/reject', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const res = await rejectWalletTopup(req, { params: Promise.resolve({ id: 'pay-1' }) })

      expect(res.status).toBe(400)
    })

    it('returns 400 when payment is not a pending wallet top-up', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: 'APPROVED',
        referenceType: 'COURSE',
      })

      const req = new NextRequest('http://localhost/api/staff/finance/wallet-topups/pay-1/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'test' }),
      })

      const res = await rejectWalletTopup(req, { params: Promise.resolve({ id: 'pay-1' }) })

      expect(res.status).toBe(400)
    })
  })
})
