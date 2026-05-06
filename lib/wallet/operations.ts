import { Prisma, TransactionType } from '@prisma/client'
import prisma from '@/lib/prisma/client'
import { getCurrencySymbol } from '@/lib/currency'
import { randomUUID } from 'crypto'

type TxClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

function normalizeWalletReference(
  type: TransactionType,
  referenceId?: string,
  referenceType?: string
) {
  const normalizedType = referenceType?.trim() || `${type}_AUTO`
  const normalizedId = referenceId?.trim() || `${normalizedType}-${randomUUID()}`

  return {
    referenceId: normalizedId,
    referenceType: normalizedType,
  }
}

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
  const reference = normalizeWalletReference(TransactionType.TOP_UP, referenceId, referenceType)

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
      description: description || `Wallet top-up of ${getCurrencySymbol(wallet.currency)}${amount}`,
      referenceId: reference.referenceId,
      referenceType: reference.referenceType,
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
      `Insufficient funds. Available: ${getCurrencySymbol(wallet.currency)}${available.toFixed(2)}, Required: ${getCurrencySymbol(wallet.currency)}${amount.toFixed(2)}`
    )
  }

  const balanceBefore = wallet.balance.toNumber()
  const availableBefore = wallet.availableBalance.toNumber()
  const reservedBefore = wallet.reservedBalance.toNumber()
  const reference = normalizeWalletReference(TransactionType.RESERVE, referenceId, referenceType)

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
      description: description || `Funds reserved: ${getCurrencySymbol(wallet.currency)}${amount}`,
      referenceId: reference.referenceId,
      referenceType: reference.referenceType,
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
  const reference = normalizeWalletReference(TransactionType.CAPTURE, referenceId, referenceType)

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
      description: description || `Payment captured: ${getCurrencySymbol(wallet.currency)}${amount}`,
      referenceId: reference.referenceId,
      referenceType: reference.referenceType,
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
  const reference = normalizeWalletReference(TransactionType.RELEASE, referenceId, referenceType)

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
      description: description || `Funds released: ${getCurrencySymbol(wallet.currency)}${amount}`,
      referenceId: reference.referenceId,
      referenceType: reference.referenceType,
    },
  })

  return updated
}

// ---------------------------------------------------------------------------
// CREDIT TO WALLET (DIRECT CREDIT/REFUND)
// IMPORTANT: Per business rules, NO CASH REFUNDS are allowed.
// All refunds are credited to the user's wallet balance only.
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
  const reference = normalizeWalletReference(TransactionType.CREDIT, referenceId, referenceType)

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
      description: description || `Wallet credited: ${getCurrencySymbol(wallet.currency)}${amount}`,
      referenceId: reference.referenceId,
      referenceType: reference.referenceType,
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
  const reference = normalizeWalletReference(TransactionType.PAYMENT, referenceId, referenceType)

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
      description: description || `Direct payment: ${getCurrencySymbol(wallet.currency)}${amount}`,
      referenceId: reference.referenceId,
      referenceType: reference.referenceType,
    },
  })

  return updated
}

// ---------------------------------------------------------------------------
// STAFF ADJUSTMENT (can increase or decrease balance with full audit)
// Used for manual corrections, migration imports, admin overrides.
// Positive amount = credit, negative amount = debit.
// ---------------------------------------------------------------------------

export async function adjustWallet(
  tx: TxClient,
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
  referenceType?: string,
  createdBy?: string
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const balanceBefore = wallet.balance.toNumber()
  const availableBefore = wallet.availableBalance.toNumber()
  const reservedBefore = wallet.reservedBalance.toNumber()
  const reference = normalizeWalletReference(TransactionType.ADJUSTMENT, referenceId, referenceType)

  // For debits, ensure sufficient available balance
  if (amount < 0 && availableBefore < Math.abs(amount)) {
    throw new Error(
      `Insufficient available balance for debit. Available: ${getCurrencySymbol(wallet.currency)}${availableBefore.toFixed(2)}, Requested: ${getCurrencySymbol(wallet.currency)}${Math.abs(amount).toFixed(2)}`
    )
  }

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
      type: TransactionType.ADJUSTMENT,
      amount: Math.abs(amount),
      balanceBefore,
      balanceAfter: balanceBefore + amount,
      reservedBefore,
      reservedAfter: reservedBefore,
      availableBefore,
      availableAfter: availableBefore + amount,
      description: description || `Staff adjustment: ${getCurrencySymbol(wallet.currency)}${amount}`,
      referenceId: reference.referenceId,
      referenceType: reference.referenceType,
      createdBy,
      metadata: { direction: amount >= 0 ? 'credit' : 'debit' },
    },
  })

  return updated
}

// ---------------------------------------------------------------------------
// SET WALLET BALANCE (idempotent — sets to exact amount, used for imports)
// Creates an adjustment transaction for the difference.
// ---------------------------------------------------------------------------

export async function setWalletBalance(
  tx: TxClient,
  userId: string,
  targetBalance: number,
  description: string,
  referenceId?: string,
  referenceType?: string,
  createdBy?: string
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const currentBalance = wallet.balance.toNumber()
  const diff = targetBalance - currentBalance

  if (Math.abs(diff) < 0.01) {
    return wallet // Already at target, no adjustment needed
  }

  return adjustWallet(tx, userId, diff, description, referenceId, referenceType, createdBy)
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
