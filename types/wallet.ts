export interface Wallet {
  id: string
  userId: string
  balance: number
  reservedBalance: number
  currency: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: 'TOP_UP' | 'RESERVE' | 'PAYMENT' | 'RELEASE' | 'REFUND' | 'ADJUSTMENT'
  amount: number
  description?: string | null
  reference?: string | null
  balanceBefore: number
  balanceAfter: number
  createdAt: Date | string
}

export type TransactionType = 'TOP_UP' | 'RESERVE' | 'PAYMENT' | 'RELEASE' | 'REFUND' | 'ADJUSTMENT'
