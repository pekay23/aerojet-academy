import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { verifyPaymentProof, getPendingPayments } from '@/lib/payments/verification'

describe('lib/payments/verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('verifyPaymentProof', () => {
    it('returns verified:true for valid payment with proof', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        proofUrl: 'https://example.com/proof.pdf',
        user: { id: 'user-1' },
      })

      const result = await verifyPaymentProof('pay-1')

      expect(result).toEqual({ verified: true })
      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        include: { user: true },
      })
    })

    it('returns verified:false when payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null)

      const result = await verifyPaymentProof('pay-missing')

      expect(result).toEqual({ verified: false, error: 'Payment not found' })
    })

    it('returns verified:false when proofUrl is missing', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        proofUrl: null,
        user: { id: 'user-1' },
      })

      const result = await verifyPaymentProof('pay-1')

      expect(result).toEqual({ verified: false, error: 'No payment proof uploaded' })
    })

    it('returns verified:false when proofUrl is empty string', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        proofUrl: '',
        user: { id: 'user-1' },
      })

      const result = await verifyPaymentProof('pay-1')

      expect(result).toEqual({ verified: false, error: 'No payment proof uploaded' })
    })

    it('includes user data in the findUnique query', async () => {
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        proofUrl: 'https://example.com/proof.pdf',
        user: { id: 'user-1', email: 'user@test.com' },
      })

      await verifyPaymentProof('pay-1')

      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        include: { user: true },
      })
    })
  })

  describe('getPendingPayments', () => {
    beforeEach(() => {
      prismaMock.payment.findMany.mockResolvedValue([])
      prismaMock.payment.count.mockResolvedValue(0)
    })

    it('queries payments with PENDING status', async () => {
      prismaMock.payment.findMany.mockResolvedValue([{ id: 'pay-1', status: 'PENDING' }])

      const result = await getPendingPayments()

      expect(result).toEqual([{ id: 'pay-1', status: 'PENDING' }])
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        include: { user: { include: { profile: true } } },
        orderBy: { createdAt: 'asc' },
      })
    })

    it('filters by referenceType when type provided', async () => {
      prismaMock.payment.findMany.mockResolvedValue([])

      await getPendingPayments('ENROLLMENT')

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING', referenceType: 'ENROLLMENT' },
        include: { user: { include: { profile: true } } },
        orderBy: { createdAt: 'asc' },
      })
    })

    it('returns empty array when no pending payments', async () => {
      const result = await getPendingPayments()
      expect(result).toEqual([])
    })

    it('orders results by createdAt ascending', async () => {
      prismaMock.payment.findMany.mockResolvedValue([
        { id: 'pay-old', createdAt: '2024-01-01' },
        { id: 'pay-new', createdAt: '2024-01-02' },
      ])

      const result = await getPendingPayments()

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        })
      )
    })

    it('includes user and profile data', async () => {
      prismaMock.payment.findMany.mockResolvedValue([{
        id: 'pay-1',
        user: { profile: { firstName: 'John' } },
      }])

      await getPendingPayments()

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { user: { include: { profile: true } } },
        })
      )
    })
  })
})
