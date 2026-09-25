import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { Metadata } from 'next'
import { prismaUnfiltered } from '@/lib/prisma/client'
import PaymentsQueue from '../../_components/PaymentsQueue'
import { PaymentStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Rejected Payments | Staff Portal' }

export default async function RejectedPaymentsPage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const pendingCount = await prismaUnfiltered.payment.count({ where: { status: 'PENDING' } })

  return <PaymentsQueue initialPendingCount={pendingCount} initialTab={PaymentStatus.REJECTED} />
}
