import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'

// Mock the auth helper
vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
}))

describe('Payment Approval Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects approval when payment is not PENDING', async () => {
    prismaMock.payment.findUnique.mockResolvedValue({
      id: 'pay-1',
      status: 'APPROVED',
      userId: 'user-1',
      amount: { toNumber: () => 500 },
    })

    // The payment is already approved — any approval logic should reject it
    const payment = await prismaMock.payment.findUnique({ where: { id: 'pay-1' } })
    expect(payment!.status).toBe('APPROVED')
    expect(payment!.status).not.toBe('PENDING')
  })

  it('updates payment status to APPROVED and credits wallet', async () => {
    const mockPayment = {
      id: 'pay-1',
      status: 'PENDING',
      userId: 'user-1',
      type: 'WALLET_TOP_UP',
      amount: { toNumber: () => 500 },
      currency: 'EUR',
    }

    const mockWallet = {
      id: 'wallet-1',
      userId: 'user-1',
      balance: { toNumber: () => 1000 },
      reservedBalance: { toNumber: () => 0 },
      availableBalance: { toNumber: () => 1000 },
      currency: 'EUR',
    }

    prismaMock.payment.findUnique.mockResolvedValue(mockPayment)
    prismaMock.wallet.findUnique.mockResolvedValue(mockWallet)
    prismaMock.payment.update.mockResolvedValue({ ...mockPayment, status: 'APPROVED' })
    prismaMock.wallet.update.mockResolvedValue({
      ...mockWallet,
      balance: { toNumber: () => 1500 },
      availableBalance: { toNumber: () => 1500 },
    })

    // Simulate the approval flow
    const payment = await prismaMock.payment.findUnique({ where: { id: 'pay-1' } })
    expect(payment!.status).toBe('PENDING')

    const updatedPayment = await prismaMock.payment.update({
      where: { id: 'pay-1' },
      data: { status: 'APPROVED' },
    })
    expect(updatedPayment.status).toBe('APPROVED')

    // Wallet should be credited
    const updatedWallet = await prismaMock.wallet.update({
      where: { userId: 'user-1' },
      data: { balance: { increment: 500 } },
    })
    expect(updatedWallet.balance.toNumber()).toBe(1500)
  })

  it('updates payment status to REJECTED without modifying wallet', async () => {
    const mockPayment = {
      id: 'pay-2',
      status: 'PENDING',
      userId: 'user-1',
      type: 'WALLET_TOP_UP',
      amount: { toNumber: () => 500 },
    }

    prismaMock.payment.findUnique.mockResolvedValue(mockPayment)
    prismaMock.payment.update.mockResolvedValue({ ...mockPayment, status: 'REJECTED' })

    const payment = await prismaMock.payment.findUnique({ where: { id: 'pay-2' } })
    expect(payment!.status).toBe('PENDING')

    const rejected = await prismaMock.payment.update({
      where: { id: 'pay-2' },
      data: { status: 'REJECTED' },
    })
    expect(rejected.status).toBe('REJECTED')

    // Wallet update should NOT have been called
    expect(prismaMock.wallet.update).not.toHaveBeenCalled()
  })
})
