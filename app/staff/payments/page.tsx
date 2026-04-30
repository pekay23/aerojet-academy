import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma, { prismaUnfiltered } from '@/lib/prisma/client'
import PaymentsQueue from '../_components/PaymentsQueue'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Payments | Staff Portal' }

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const pendingCount = await prismaUnfiltered.payment.count({ where: { status: 'PENDING' } })
  const initialTab = ['PENDING', 'APPROVED', 'REJECTED'].includes(tabParam?.toUpperCase() ?? '')
    ? tabParam!.toUpperCase()
    : 'PENDING'
  return <PaymentsQueue initialPendingCount={pendingCount} initialTab={initialTab} />
}
