import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

// Mock all dependencies the approve route needs
vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
}))

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  PERMISSIONS: { APPROVE_PAYMENTS: 'approve_payments' },
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {
    PAYMENT_APPROVE: 'PAYMENT_APPROVE',
    PAYMENT_REJECT: 'PAYMENT_REJECT',
  },
}))

vi.mock('@/lib/email/service', () => ({
  sendPaymentApprovedEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentRejectedEmail: vi.fn().mockResolvedValue(undefined),
  sendSeatReservationConfirmedEmail: vi.fn().mockResolvedValue(undefined),
  sendActivationEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/wallet/operations', () => ({
  topUpWallet: vi.fn(),
}))

vi.mock('@/lib/enrollment/pathway', () => ({
  shouldPromoteOnPayment: vi.fn().mockReturnValue(false),
  promoteApplicantToStudent: vi.fn(),
}))

vi.mock('@/lib/enrollment/full-time', () => ({
  generateMilestonesForYear: vi.fn(),
}))

vi.mock('@/lib/utils/string', () => ({
  formatPaymentType: vi.fn((t: string) => t),
}))

vi.mock('@/lib/referral/operations', () => ({
  qualifyReferral: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/staff/payments/[id]/approve/route'
import { sendPaymentApprovedEmail, sendPaymentRejectedEmail } from '@/lib/email/service'
import { topUpWallet } from '@/lib/wallet/operations'

/** Prisma Decimal-like value: Number() coercion works via valueOf() */
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

function makeRequest(action: string, extra: Record<string, any> = {}) {
  return new NextRequest('http://localhost/api/staff/payments/pay-1/approve', {
    method: 'POST',
    body: JSON.stringify({ action, ...extra }),
  })
}

describe('Payment Approval — POST /api/staff/payments/[id]/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: notification create succeeds
    prismaMock.notification.create.mockResolvedValue({} as any)
  })

  it('rejects invalid action', async () => {
    const req = makeRequest('cancel')
    const res = await POST(req, { params: Promise.resolve({ id: 'pay-1' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('approve')
  })

  it('returns 404 when payment not found', async () => {
    prismaMock.payment.findUnique.mockResolvedValueOnce(null)
    const req = makeRequest('approve')
    const res = await POST(req, { params: Promise.resolve({ id: 'pay-1' }) })
    expect(res.status).toBe(404)
  })

  it('rejects approval of non-PENDING payment', async () => {
    prismaMock.payment.findUnique.mockResolvedValueOnce(makePayment({ status: 'APPROVED' }) as any)
    const req = makeRequest('approve')
    const res = await POST(req, { params: Promise.resolve({ id: 'pay-1' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('already APPROVED')
  })

  it('approves wallet top-up: updates payment, credits wallet, sends email', async () => {
    const payment = makePayment()
    prismaMock.payment.findUnique.mockResolvedValueOnce(payment as any)
    prismaMock.payment.update.mockResolvedValueOnce({ ...payment, status: 'APPROVED' } as any)
    // Wallet top-up transaction: wallet exists
    prismaMock.wallet.findUnique.mockResolvedValueOnce({ id: 'wallet-1', userId: 'user-1' } as any)

    const req = makeRequest('approve')
    const res = await POST(req, { params: Promise.resolve({ id: 'pay-1' }) })
    expect(res.status).toBe(200)

    // Payment status updated to APPROVED
    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay-1' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      })
    )

    // Wallet was credited via topUpWallet
    expect(topUpWallet).toHaveBeenCalledWith(
      expect.anything(), // tx
      'user-1',
      500,
      expect.stringContaining('top-up'),
      'pay-1',
      'PAYMENT_ID'
    )

    // Approval email sent
    expect(sendPaymentApprovedEmail).toHaveBeenCalledWith(
      'test@example.com',
      'John',
      'WALLET_TOPUP',
      500
    )
  })

  it('rejects payment without reason returns error', async () => {
    prismaMock.payment.findUnique.mockResolvedValueOnce(makePayment() as any)

    const req = makeRequest('reject') // no reason field
    const res = await POST(req, { params: Promise.resolve({ id: 'pay-1' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Rejection reason')
  })

  it('rejects payment: updates status, sends rejection email, does NOT credit wallet', async () => {
    const payment = makePayment()
    prismaMock.payment.findUnique.mockResolvedValueOnce(payment as any)
    prismaMock.payment.update.mockResolvedValueOnce({ ...payment, status: 'REJECTED' } as any)

    const req = makeRequest('reject', { reason: 'Invalid receipt' })
    const res = await POST(req, { params: Promise.resolve({ id: 'pay-1' }) })
    expect(res.status).toBe(200)

    // Payment status updated to REJECTED
    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'REJECTED',
          rejectionReason: 'Invalid receipt',
        }),
      })
    )

    // Rejection email sent
    expect(sendPaymentRejectedEmail).toHaveBeenCalledWith(
      'test@example.com',
      'John',
      'WALLET_TOPUP',
      'Invalid receipt'
    )

    // Wallet was NOT touched
    expect(topUpWallet).not.toHaveBeenCalled()
  })
})
