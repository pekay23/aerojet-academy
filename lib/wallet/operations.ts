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
  userId: string,
  amount: number,
  description?: string,
  reference?: string
) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } })
    if (!wallet) throw new Error('Wallet not found')

    const balanceBefore = wallet.balance.toNumber()
    const newBalance = balanceBefore + amount

    const updated = await tx.wallet.update({
      where: { userId },
      data: {
        balance: newBalance,
        availableBalance: newBalance - wallet.reservedBalance.toNumber(),
      },
    })

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.TOP_UP,
        amount,
        balanceBefore,
        balanceAfter: newBalance,
        description: description || `Wallet top-up of €${amount}`,
        referenceId: reference,
      },
    })

    return updated
  })
}

// ---------------------------------------------------------------------------
// RESERVE FUNDS (hold for pool join)
// ---------------------------------------------------------------------------

export async function reserveFunds(
  tx: TxClient,
  userId: string,
  amount: number,
  description?: string,
  reference?: string
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const available = wallet.balance.toNumber() - wallet.reservedBalance.toNumber()
  if (available < amount) {
    throw new Error(
      `Insufficient funds. Available: €${available.toFixed(2)}, Required: €${amount.toFixed(2)}`
    )
  }

  const balanceBefore = wallet.balance.toNumber()
  const newReserved = wallet.reservedBalance.toNumber() + amount

  const updated = await tx.wallet.update({
    where: { userId },
    data: {
      reservedBalance: newReserved,
      availableBalance: wallet.balance.toNumber() - newReserved,
    },
  })

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: TransactionType.RESERVE,
      amount,
      balanceBefore,
      referenceId: reference,
      balanceAfter: balanceBefore,
      description: description || `Funds reserved: €${amount}`,
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
  reference?: string
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const balanceBefore = wallet.balance.toNumber()
  const newBalance = balanceBefore - amount
  const newReserved = wallet.reservedBalance.toNumber() - amount

  if (newBalance < 0 || newReserved < 0) {
    throw new Error('Invalid capture: would result in negative balance')
  }

  const updated = await tx.wallet.update({
    where: { userId },
    data: {
      balance: newBalance,
      reservedBalance: newReserved,
      availableBalance: newBalance - newReserved,
    },
  })

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: TransactionType.PAYMENT,
      amount,
      balanceBefore,
      referenceId: reference,
      balanceAfter: newBalance,
      description: description || `Payment captured: €${amount}`,
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
  reference?: string
) {
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) throw new Error('Wallet not found')

  const balanceBefore = wallet.balance.toNumber()
  const newReserved = Math.max(0, wallet.reservedBalance.toNumber() - amount)

  const updated = await tx.wallet.update({
    where: { userId },
    data: {
      reservedBalance: newReserved,
      availableBalance: wallet.balance.toNumber() - newReserved,
    },
  })

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: TransactionType.RELEASE,
      amount,
      balanceBefore,
      referenceId: reference,
      balanceAfter: balanceBefore,
      description: description || `Funds released: €${amount}`,
    },
  })

  return updated
}

// ---------------------------------------------------------------------------
// REFUND TO WALLET
// ---------------------------------------------------------------------------

export async function refundToWallet(
  userId: string,
  amount: number,
  description?: string,
  reference?: string
) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } })
    if (!wallet) throw new Error('Wallet not found')

    const balanceBefore = wallet.balance.toNumber()
    const newBalance = balanceBefore + amount

    const updated = await tx.wallet.update({
      where: { userId },
      data: {
        balance: newBalance,
        availableBalance: newBalance - wallet.reservedBalance.toNumber(),
      },
    })

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.REFUND,
        amount,
        balanceBefore,
        referenceId: reference,
        balanceAfter: newBalance,
        description: description || `Refund: €${amount}`,
      },
    })

    return updated
  })
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
