import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  PERMISSIONS: { APPROVE_PAYMENTS: 'approve_payments' },
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  logAuditEvent: vi.fn(),
  AuditAction: { SYSTEM_UPDATE: 'SYSTEM_UPDATE' },
}))

vi.mock('@/lib/wallet/operations', () => ({
  getOrCreateWallet: vi.fn(),
  topUpWallet: vi.fn(),
}))

vi.mock('@/lib/currency-api', () => ({
  convertCurrency: vi.fn().mockResolvedValue({ convertedAmount: 100, rate: 1.2 }),
}))

vi.mock('@/lib/analytics/events', () => ({
  trackWalletTopUp: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/referral/operations', () => ({
  qualifyReferral: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/finance/overview', () => ({
  getFinanceOverviewData: vi.fn(),
}))

vi.mock('@/lib/finance/overview', () => ({
  getFinanceOverviewData: vi.fn(),
}))

vi.mock('@/lib/finance/overview', () => ({
  getFinanceOverviewData: vi.fn(),
}))

import { GET } from '@/app/api/staff/finance/overview/route'
import { POST } from '@/app/api/staff/finance/wallet-topups/[id]/approve/route'
import { getFinanceOverviewData } from '@/lib/finance/overview'
import { topUpWallet } from '@/lib/wallet/operations'
import { createAuditLog } from '@/lib/audit/logger'
import { qualifyReferral } from '@/lib/referral/operations'

function decimal(n: number) {
  return { toNumber: () => n, valueOf: () => n, toString: () => String(n) }
}

function makePayment(overrides: Record<string, any> = {}) {
  return {
    id: 'pay-1',
    status: 'PENDING',
    userId: 'user-1',
    amount: decimal(500),
    currency: 'EUR',
    paymentCurrency: 'EUR',
    originalAmount: decimal(500),
    referenceType: 'WALLET_TOPUP',
    referenceCode: 'REF-123',
    referenceId: null,
    user: {
      id: 'user-1',
      email: 'test@example.com',
      personalEmail: 'test@example.com',
      academyEmail: null,
      role: 'STUDENT',
      status: 'ACTIVE',
      programmeChoice: null,
      profile: { firstName: 'John', middleName: null, lastName: 'Doe' },
    },
    ...overrides,
  }
}

describe('Staff Finance — overview + wallet-topup approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.notification.create.mockResolvedValue({} as any)
  })

  describe('GET /api/staff/finance/overview', () => {
    it('returns 401 when unauthenticated', async () => {
      const { getAuthSession } = await import('@/lib/auth/helpers')
      vi.mocked(getAuthSession).mockResolvedValue(null)

      const req = new NextRequest('http://localhost/api/staff/finance/overview')
      const res = await GET()
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 403 when role is STUDENT', async () => {
      const { getAuthSession } = await import('@/lib/auth/helpers')
      vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STUDENT' } } as any)

      const req = new NextRequest('http://localhost/api/staff/finance/overview')
      const res = await GET()
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('Forbidden')
    })

    it('returns finance overview data for staff', async () => {
      const { getAuthSession } = await import('@/lib/auth/helpers')
      vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)

      const overview = {
        totalRevenue: 10000,
        totalRevenueCount: 50,
        totalRegistration: 2000,
        totalCourse: 3000,
        monthRegistration: 500,
        monthCourse: 800,
        lastMonthRegistration: 400,
        lastMonthCourse: 700,
        pendingCount: 5,
        pendingTotal: 1500,
        recentTransactions: [],
      }
      ;(getFinanceOverviewData as any).mockResolvedValue(overview)

      const res = await GET()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.totalRevenue).toBe(10000)
      expect(json.pendingCount).toBe(5)
      expect(json.recentTransactions).toEqual([])
    })
  })

  describe('POST /api/staff/finance/wallet-topups/[id]/approve', () => {
    function makeRequest(extra: Record<string, any> = {}) {
      return new NextRequest('http://localhost/api/staff/finance/wallet-topups/pay-1/approve', {
        method: 'POST',
        body: JSON.stringify({ action: 'approve', ...extra }),
      })
    }

    it('returns 404 when payment not found', async () => {
      const { requirePermission } = await import('@/lib/auth/permissions')
      vi.mocked(requirePermission).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' } as any)
      prismaMock.payment.findUnique.mockResolvedValueOnce(null)

      const req = makeRequest()
      const res = await POST(req, { params: Promise.resolve({ id: 'pay-1' }) })
      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toBe('Payment record not found')
    })

    it('returns 400 when payment is not PENDING', async () => {
      const { requirePermission } = await import('@/lib/auth/permissions')
      vi.mocked(requirePermission).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' } as any)
      prismaMock.payment.findUnique.mockResolvedValueOnce(makePayment({ status: 'APPROVED' }) as any)

      const req = makeRequest()
      const res = await POST(req, { params: Promise.resolve({ id: 'pay-1' }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Top-up request is not pending')
    })

    it('returns 400 when payment is not a wallet top-up', async () => {
      const { requirePermission } = await import('@/lib/auth/permissions')
      vi.mocked(requirePermission).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' } as any)
      prismaMock.payment.findUnique.mockResolvedValueOnce(makePayment({ referenceType: 'REGISTRATION' }) as any)

      const req = makeRequest()
      const res = await POST(req, { params: Promise.resolve({ id: 'pay-1' }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Payment is not a wallet top-up request')
    })

    it('approves wallet top-up: updates payment, credits wallet, logs audit', async () => {
      const { requirePermission } = await import('@/lib/auth/permissions')
      vi.mocked(requirePermission).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' } as any)

      const payment = makePayment()
      prismaMock.payment.findUnique.mockResolvedValueOnce(payment as any)
      prismaMock.payment.update.mockResolvedValueOnce({ ...payment, status: 'APPROVED' } as any)
      prismaMock.wallet.findUnique.mockResolvedValueOnce({ id: 'wallet-1', userId: 'user-1' } as any)

      const req = makeRequest()
      const res = await POST(req, { params: Promise.resolve({ id: 'pay-1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)

      expect(prismaMock.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-1' },
          data: expect.objectContaining({ status: 'APPROVED' }),
        })
      )

      expect(topUpWallet).toHaveBeenCalledWith(
        expect.anything(),
        'user-1',
        500,
        expect.stringContaining('top-up'),
        'pay-1',
        'PAYMENT_ID'
      )

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SYSTEM_UPDATE',
          entity: 'payments',
          entityId: 'pay-1',
          description: expect.stringContaining('Approved wallet top-up'),
        })
      )

      await vi.waitFor(() => {
        expect(qualifyReferral).toHaveBeenCalledWith('user-1')
      })
    })

    it('handles non-EUR currency conversion during approval', async () => {
      const { requirePermission } = await import('@/lib/auth/permissions')
      const { convertCurrency } = await import('@/lib/currency-api')
      vi.mocked(requirePermission).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' } as any)
      vi.mocked(convertCurrency).mockResolvedValue({ convertedAmount: 450, rate: 0.9 })

      const payment = makePayment({ currency: 'USD', paymentCurrency: 'USD', originalAmount: decimal(500) })
      prismaMock.payment.findUnique.mockResolvedValueOnce(payment as any)
      prismaMock.payment.update.mockResolvedValueOnce({ ...payment, status: 'APPROVED' } as any)
      prismaMock.wallet.findUnique.mockResolvedValueOnce({ id: 'wallet-1', userId: 'user-1' } as any)

      const req = makeRequest()
      const res = await POST(req, { params: Promise.resolve({ id: 'pay-1' }) })
      expect(res.status).toBe(200)

      expect(topUpWallet).toHaveBeenCalledWith(
        expect.anything(),
        'user-1',
        450,
        expect.stringContaining('converted from USD'),
        'pay-1',
        'PAYMENT_ID'
      )
    })
  })
})
