import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import prisma from '@/lib/prisma/client'
import PaymentsQueue from '../../_components/PaymentsQueue'

export const metadata: Metadata = { title: 'Rejected Payments | Staff Portal' }

export default async function RejectedPaymentsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const pendingCount = await prisma.payment.count({ where: { status: 'PENDING' } })

  return <PaymentsQueue initialPendingCount={pendingCount} initialTab="REJECTED" />
}
