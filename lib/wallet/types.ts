import { Prisma } from '@prisma/client'

export interface WalletBalanceInfo {
  balance: number
  reservedBalance: number
  availableBalance: number
  currency: string
}

export interface TransactionCreateInput {
  walletId: string
  type: string
  amount: number
  description: string
  reference?: string
}

export type PrismaTransaction = Prisma.TransactionClient
