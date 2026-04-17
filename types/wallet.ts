import { TransactionType } from './enums'

export interface Wallet {
  id: string
  userId: string
  balance: number
  reservedBalance: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: TransactionType
  amount: number
  description?: string | null
  reference?: string | null
  balanceBefore: number
  balanceAfter: number
  createdAt: string
}

export type { TransactionType }
