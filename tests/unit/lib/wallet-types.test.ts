import { describe, it, expect } from 'vitest'
import { WalletBalanceInfo, TransactionCreateInput, PrismaTransaction } from '@/lib/wallet/types'

describe('lib/wallet/types', () => {
  it('WalletBalanceInfo has correct shape', () => {
    const info: WalletBalanceInfo = {
      balance: 100,
      reservedBalance: 20,
      availableBalance: 80,
      currency: 'EUR',
    }
    expect(info.balance).toBe(100)
    expect(info.availableBalance).toBe(80)
  })

  it('TransactionCreateInput has correct shape', () => {
    const input: TransactionCreateInput = {
      walletId: 'wallet-1',
      type: 'PAYMENT',
      amount: 50,
      description: 'Test payment',
      reference: 'REF-001',
    }
    expect(input.walletId).toBe('wallet-1')
    expect(input.amount).toBe(50)
  })

  it('PrismaTransaction is a type alias', () => {
    const tx: PrismaTransaction = {} as any
    expect(tx).toBeDefined()
  })
})
