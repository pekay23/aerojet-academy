import prisma from '@/lib/prisma/client'

export async function getTransactions(
  userId: string,
  opts?: { type?: string; limit?: number; offset?: number }
) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) return { transactions: [], total: 0 }

  const where = { walletId: wallet.id, ...(opts?.type ? { type: opts.type } : {}) }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: where as any,
      orderBy: { createdAt: 'desc' },
      take: opts?.limit || 20,
      skip: opts?.offset || 0,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.walletTransaction.count({ where: where as any }),
  ])

  return { transactions, total }
}

export function generatePaymentReference(prefix: string = 'PAY'): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}${random}`
}

export function generateWalletTopUpReference(): string {
  return generatePaymentReference('WTU')
}
