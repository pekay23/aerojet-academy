import prisma from '@/lib/prisma/client'

export async function getWalletBalance(userId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) return null

  const balance = Number(wallet.balance)
  const reserved = Number(wallet.reservedBalance)

  return {
    balance,
    reservedBalance: reserved,
    availableBalance: Math.max(0, balance - reserved),
    currency: wallet.currency,
  }
}

export async function hasAvailableBalance(userId: string, amount: number): Promise<boolean> {
  const info = await getWalletBalance(userId)
  if (!info) return false
  return info.availableBalance >= amount
}

export async function ensureWalletExists(userId: string, currency: string = 'EUR') {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0, reservedBalance: 0, availableBalance: 0, currency },
  })
}
