import prisma from '@/lib/prisma/client'

export async function getActivePaymentMethods() {
  return prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getPaymentMethodsByType(type: string) {
  return prisma.paymentMethod.findMany({
    where: { isActive: true, type },
    orderBy: { sortOrder: 'asc' },
  })
}

export type PaymentMethodRecord = Awaited<ReturnType<typeof getActivePaymentMethods>>[number]
