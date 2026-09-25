import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import PaymentsQueue from '../_components/PaymentsQueue'
import { Metadata } from 'next'
import { PaymentStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Payments | Staff Portal' }

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const pendingCount = await prismaUnfiltered.payment.count({ where: { status: 'PENDING' } })
  const validTabs: PaymentStatus[] = ['PENDING', 'APPROVED', 'REJECTED']
  const initialTab = validTabs.includes(tabParam?.toUpperCase() as PaymentStatus)
    ? (tabParam!.toUpperCase() as PaymentStatus)
    : PaymentStatus.PENDING
  return <PaymentsQueue initialPendingCount={pendingCount} initialTab={initialTab} />
}
