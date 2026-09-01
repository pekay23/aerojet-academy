import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { getWalletBalance, hasAvailableBalance, ensureWalletExists } from '@/lib/wallet/balance'

describe('lib/wallet/balance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWalletBalance', () => {
    it('returns null when wallet does not exist', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(null)

      const result = await getWalletBalance('user-1')

      expect(result).toBeNull()
    })

    it('returns balance info when wallet exists', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue({
        userId: 'user-1',
        balance: 1000,
        reservedBalance: 300,
        currency: 'EUR',
      })

      const result = await getWalletBalance('user-1')

      expect(result).toEqual({
        balance: 1000,
        reservedBalance: 300,
        availableBalance: 700,
        currency: 'EUR',
      })
    })

    it('never returns negative available balance', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue({
        userId: 'user-1',
        balance: 100,
        reservedBalance: 500,
        currency: 'EUR',
      })

      const result = await getWalletBalance('user-1')

      expect(result!.availableBalance).toBe(0)
    })
  })

  describe('hasAvailableBalance', () => {
    it('returns true when balance is sufficient', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue({
        userId: 'user-1',
        balance: 1000,
        reservedBalance: 200,
        currency: 'EUR',
      })

      const result = await hasAvailableBalance('user-1', 500)

      expect(result).toBe(true)
    })

    it('returns false when balance is insufficient', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue({
        userId: 'user-1',
        balance: 100,
        reservedBalance: 50,
        currency: 'EUR',
      })

      const result = await hasAvailableBalance('user-1', 100)

      expect(result).toBe(false)
    })

    it('returns false when wallet does not exist', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(null)

      const result = await hasAvailableBalance('user-1', 100)

      expect(result).toBe(false)
    })
  })

  describe('ensureWalletExists', () => {
    it('creates a new wallet when it does not exist', async () => {
      prismaMock.wallet.upsert.mockResolvedValue({
        userId: 'user-1',
        balance: 0,
        reservedBalance: 0,
        availableBalance: 0,
        currency: 'EUR',
      })

      const result = await ensureWalletExists('user-1', 'EUR')

      expect(prismaMock.wallet.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: {},
        create: {
          userId: 'user-1',
          balance: 0,
          reservedBalance: 0,
          availableBalance: 0,
          currency: 'EUR',
        },
      })
      expect(result).toBeDefined()
    })

    it('uses EUR as default currency', async () => {
      prismaMock.wallet.upsert.mockResolvedValue({})

      await ensureWalletExists('user-1')

      expect(prismaMock.wallet.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ currency: 'EUR' }),
        })
      )
    })
  })
})
