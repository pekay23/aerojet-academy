import { Prisma, TransactionType } from '@prisma/client'
import prisma from '@/lib/prisma/client'

type TxClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

// ---------------------------------------------------------------------------
// GET WALLET
// ---------------------------------------------------------------------------

export async function getWallet(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!wallet) {
    throw new Error('Wallet not found')
  }

  return wallet
}

export async function getOrCreateWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({ where: { userId } })

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        reservedBalance: 0,
        availableBalance: 0,
        currency: 'EUR',
      },
    })
  }

  return wallet
}

// ---------------------------------------------------------------------------
// TOP UP (staff approved)
// ---------------------------------------------------------------------------

export async function topUpWallet(
  tx: TxClient,
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string,
  referenceType?: string
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const balanceBefore = wallet.balance.toNumber()
  const availableBefore = wallet.availableBalance.toNumber()
  const reservedBefore = wallet.reservedBalance.toNumber()

  const updated = await tx.wallet.update({
    where: { userId },
    data: {
      balance: { increment: amount },
      availableBalance: { increment: amount },
    },
  })

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: TransactionType.TOP_UP,
      amount,
      balanceBefore,
      balanceAfter: balanceBefore + amount,
      reservedBefore,
      reservedAfter: reservedBefore,
      availableBefore,
      availableAfter: availableBefore + amount,
      description: description || `Wallet top-up of €${amount}`,
      referenceId,
      referenceType,
    },
  })

  return updated
}

// ---------------------------------------------------------------------------
// RESERVE FUNDS (hold for pool join)
// ---------------------------------------------------------------------------

export async function reserveFunds(
  tx: TxClient,
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string,
  referenceType?: string
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const available = wallet.availableBalance.toNumber()
  if (available < amount) {
    throw new Error(
      `Insufficient funds. Available: €${available.toFixed(2)}, Required: €${amount.toFixed(2)}`
    )
  }

  const balanceBefore = wallet.balance.toNumber()
  const availableBefore = wallet.availableBalance.toNumber()
  const reservedBefore = wallet.reservedBalance.toNumber()

  const updated = await tx.wallet.update({
    where: { userId },
    data: {
      reservedBalance: { increment: amount },
      availableBalance: { decrement: amount },
    },
  })

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: TransactionType.RESERVE,
      amount,
      balanceBefore,
      balanceAfter: balanceBefore,
      reservedBefore,
      reservedAfter: reservedBefore + amount,
      availableBefore,
      availableAfter: availableBefore - amount,
      description: description || `Funds reserved: €${amount}`,
      referenceId,
      referenceType,
    },
  })

  return updated
}

// ---------------------------------------------------------------------------
// CAPTURE FUNDS (deduct on pool confirmation)
// ---------------------------------------------------------------------------

export async function captureFunds(
  tx: TxClient,
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string,
  referenceType?: string
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const balanceBefore = wallet.balance.toNumber()
  const availableBefore = wallet.availableBalance.toNumber()
  const reservedBefore = wallet.reservedBalance.toNumber()

  if (reservedBefore < amount) {
    throw new Error('Invalid capture: reserved balance is less than capture amount')
  }

  const updated = await tx.wallet.update({
    where: { userId },
    data: {
      balance: { decrement: amount },
      reservedBalance: { decrement: amount },
    },
  })

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: TransactionType.CAPTURE,
      amount,
      balanceBefore,
      balanceAfter: balanceBefore - amount,
      reservedBefore,
      reservedAfter: reservedBefore - amount,
      availableBefore,
      availableAfter: availableBefore,
      description: description || `Payment captured: €${amount}`,
      referenceId,
      referenceType,
    },
  })

  return updated
}

// ---------------------------------------------------------------------------
// RELEASE FUNDS (return held funds on pool failure)
// ---------------------------------------------------------------------------

export async function releaseFunds(
  tx: TxClient,
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string,
  referenceType?: string
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const balanceBefore = wallet.balance.toNumber()
  const availableBefore = wallet.availableBalance.toNumber()
  const reservedBefore = wallet.reservedBalance.toNumber()

  if (reservedBefore < amount) {
    throw new Error('Invalid release: requested amount exceeds reserved funds')
  }

  const updated = await tx.wallet.update({
    where: { userId },
    data: {
      reservedBalance: { decrement: amount },
      availableBalance: { increment: amount },
    },
  })

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: TransactionType.RELEASE,
      amount,
      balanceBefore,
      balanceAfter: balanceBefore,
      reservedBefore,
      reservedAfter: reservedBefore - amount,
      availableBefore,
      availableAfter: availableBefore + amount,
      description: description || `Funds released: €${amount}`,
      referenceId,
      referenceType,
    },
  })

  return updated
}

// ---------------------------------------------------------------------------
// CREDIT TO WALLET (DIRECT CREDIT/REFUND)
// ---------------------------------------------------------------------------

export async function creditToWallet(
  tx: TxClient,
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string,
  referenceType?: string
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const balanceBefore = wallet.balance.toNumber()
  const availableBefore = wallet.availableBalance.toNumber()
  const reservedBefore = wallet.reservedBalance.toNumber()

  const updated = await tx.wallet.update({
    where: { userId },
    data: {
      balance: { increment: amount },
      availableBalance: { increment: amount },
    },
  })

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: TransactionType.CREDIT,
      amount,
      balanceBefore,
      balanceAfter: balanceBefore + amount,
      reservedBefore,
      reservedAfter: reservedBefore,
      availableBefore,
      availableAfter: availableBefore + amount,
      description: description || `Wallet credited: €${amount}`,
      referenceId,
      referenceType,
    },
  })

  return updated
}

// ---------------------------------------------------------------------------
// DIRECT CHARGE (deduct available balance instantly without reserve)
// ---------------------------------------------------------------------------

export async function chargeWallet(
  tx: TxClient,
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string,
  referenceType?: string
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const balanceBefore = wallet.balance.toNumber()
  const availableBefore = wallet.availableBalance.toNumber()
  const reservedBefore = wallet.reservedBalance.toNumber()

  if (availableBefore < amount) {
    throw new Error('Insufficient available balance for this charge.')
  }

  const updated = await tx.wallet.update({
    where: { userId },
    data: {
      balance: { decrement: amount },
      availableBalance: { decrement: amount },
    },
  })

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: TransactionType.PAYMENT,
      amount,
      balanceBefore,
      balanceAfter: balanceBefore - amount,
      reservedBefore,
      reservedAfter: reservedBefore,
      availableBefore,
      availableAfter: availableBefore - amount,
      description: description || `Direct payment: €${amount}`,
      referenceId,
      referenceType,
    },
  })

  return updated
}

// ---------------------------------------------------------------------------
// GET TRANSACTIONS
// ---------------------------------------------------------------------------

export async function getTransactions(
  userId: string,
  options?: {
    type?: TransactionType
    limit?: number
    offset?: number
  }
) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const where: Prisma.WalletTransactionWhereInput = {
    walletId: wallet.id,
    ...(options?.type && { type: options.type }),
  }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }),
    prisma.walletTransaction.count({ where }),
  ])

  return { transactions, total }
}
