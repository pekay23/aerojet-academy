import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import PeopleTabs from '../_components/PeopleTabs'
import { UserRole, UserStatus } from '@/types/enums'

export const metadata: Metadata = { title: 'People | Staff Portal' }

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const [
    total,
    applicantAll,
    applicantPendingPayment,
    applicantPendingApproval,
    studentAll,
    studentActive,
    studentSuspended,
    studentArchived,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.APPLICANT, status: UserStatus.PENDING } }),
    prisma.user.count({ where: { role: UserRole.APPLICANT, status: UserStatus.PENDING, registrationPaid: false } }),
    prisma.user.count({ where: { role: UserRole.APPLICANT, status: UserStatus.PENDING, registrationPaid: true } }),
    prisma.user.count({ where: { role: UserRole.STUDENT } }),
    prisma.user.count({ where: { role: UserRole.STUDENT, status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.STUDENT, status: UserStatus.SUSPENDED } }),
    prisma.user.count({ where: { role: UserRole.STUDENT, status: UserStatus.ARCHIVED } }),
  ])

  return (
    <PeopleTabs
      initialTab={tab}
      initialTotal={total}
      applicantCounts={{
        all: applicantAll,
        pending_payment: applicantPendingPayment,
        pending_approval: applicantPendingApproval,
      }}
      studentCounts={{
        all: studentAll,
        active: studentActive,
        suspended: studentSuspended,
        archived: studentArchived,
      }}
    />
  )
}
