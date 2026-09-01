import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as studentWalletTopUp } from '@/app/api/student/wallet/top-up/route'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

// Mock auth helpers
const mockRequireStudent = vi.fn()
vi.mock('@/lib/auth/helpers', () => ({
  requireStudent: () => mockRequireStudent(),
}))

// Mock validation
const mockValidateBody = vi.fn()
vi.mock('@/lib/validation/schemas', () => ({
  walletTopUpSchema: {},
  validateBody: (...args: any[]) => mockValidateBody(...args),
}))

// Mock analytics
vi.mock('@/lib/analytics/events', () => ({
  trackPaymentSubmitted: vi.fn().mockResolvedValue(undefined),
}))

// Mock settings
vi.mock('@/lib/settings', () => ({
  getSystemSetting: vi.fn().mockResolvedValue('EUR'),
}))

// Mock currency
vi.mock('@/lib/currency', () => ({
  getCurrencySymbol: vi.fn((c: string) => c === 'GHS' ? 'GH₵' : '€'),
}))

describe('Student Wallet Top-up Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireStudent.mockResolvedValue({ id: 'student-1', email: 'student@test.com' })
    mockValidateBody.mockReturnValue({ success: true, data: { amount: 100, proofUrl: 'http://proof', notes: 'test' } })
  })

  it('creates a pending wallet top-up payment', async () => {
    prismaMock.payment.create.mockResolvedValue({
      id: 'pay-1',
      amount: 100,
      currency: 'EUR',
      referenceCode: 'WTU-ABC123',
      userId: 'student-1',
    })

    const req = new NextRequest('http://localhost/api/student/wallet/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount: 100, proofUrl: 'http://proof', notes: 'test' }),
    })

    const res = await studentWalletTopUp(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.data.message).toContain('Top-up request')
    expect(data.data.paymentId).toBe('pay-1')
    expect(data.data.reference).toMatch(/^WTU-[A-F0-9]+$/)
    expect(data.data.reference).toHaveLength(12) // WTU- + 8 hex chars
    expect(prismaMock.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'student-1',
        amount: 100,
        paymentMethod: 'WALLET_TOP_UP',
        referenceType: 'WALLET_TOP_UP',
        proofUrl: 'http://proof',
        notes: 'test',
      }),
    })
  })

  it('returns 400 when validation fails', async () => {
    mockValidateBody.mockReturnValue({ success: false, error: 'Invalid amount' })

    const req = new NextRequest('http://localhost/api/student/wallet/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount: -10 }),
    })

    const res = await studentWalletTopUp(req)

    expect(res.status).toBe(400)
  })

  it('generates a unique reference code', async () => {
    prismaMock.payment.create.mockResolvedValue({
      id: 'pay-1',
      amount: 100,
      currency: 'EUR',
      referenceCode: 'WTU-XYZ789',
      userId: 'student-1',
    })

    const req = new NextRequest('http://localhost/api/student/wallet/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount: 100, proofUrl: 'http://proof' }),
    })

    const res = await studentWalletTopUp(req)
    const data = await res.json()

    expect(data.data.reference).toMatch(/^WTU-[A-F0-9]+$/)
    expect(data.data.reference).toHaveLength(12) // WTU- + 8 hex chars
  })
})
