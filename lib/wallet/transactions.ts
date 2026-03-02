import prisma from '@/lib/prisma/client'

export async function getTransactions(
  userId: string,
  opts?: { type?: string; limit?: number; offset?: number }
) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) return { transactions: [], total: 0 }

  const where: any = { walletId: wallet.id }
  if (opts?.type) where.type = opts.type

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts?.limit || 20,
      skip: opts?.offset || 0,
    }),
    prisma.walletTransaction.count({ where }),
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
