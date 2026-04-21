import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { unstable_cache } from 'next/cache'

export async function getActivePaymentMethods() {
  return unstable_cache(
    async () => {
      return prisma.paymentMethod.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
    },
    ['active-payment-methods'],
    { revalidate: 300, tags: ['payment-methods'] }
  )()
}

export async function getPaymentMethodsByType(type: string) {
  return prisma.paymentMethod.findMany({
    where: { isActive: true, type },
    orderBy: { sortOrder: 'asc' },
  })
}

export type PaymentMethodRecord = Awaited<ReturnType<typeof getActivePaymentMethods>>[number]
