import { getCachedSession } from '@/lib/auth/session-context'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Metadata } from 'next'
import PeopleTabs from '../_components/PeopleTabs'

export const metadata: Metadata = { title: 'People | Staff Portal' }

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const session = await getCachedSession()
  if (!session) redirect('/login')

  // Optimize: Use unfiltered base client for global counts (staff-only page, bypasses RLS + extension overhead)
  const queryResult: any[] = await prismaUnfiltered.$queryRaw`
    SELECT
      COUNT(*)::int as "total",
      COUNT(*) FILTER (WHERE "role"::text = 'APPLICANT' AND "status"::text = 'PENDING')::int as "applicantAll",
      COUNT(*) FILTER (WHERE "role"::text = 'APPLICANT' AND "status"::text = 'PENDING' AND "registrationPaid" = false)::int as "applicantPendingPayment",
      COUNT(*) FILTER (WHERE "role"::text = 'APPLICANT' AND "status"::text = 'PENDING' AND "registrationPaid" = true)::int as "applicantPendingApproval",
      COUNT(*) FILTER (WHERE "role"::text = 'STUDENT')::int as "studentAll",
      COUNT(*) FILTER (WHERE "role"::text = 'STUDENT' AND "status"::text = 'ACTIVE')::int as "studentActive",
      COUNT(*) FILTER (WHERE "role"::text = 'STUDENT' AND "status"::text = 'SUSPENDED')::int as "studentSuspended",
      COUNT(*) FILTER (WHERE "role"::text = 'STUDENT' AND "status"::text = 'ARCHIVED')::int as "studentArchived"
    FROM "users"
    WHERE "deletedAt" IS NULL
  `

  const counts = queryResult[0] || { 
    total: 0, 
    applicantAll: 0, 
    applicantPendingPayment: 0, 
    applicantPendingApproval: 0,
    studentAll: 0,
    studentActive: 0,
    studentSuspended: 0,
    studentArchived: 0
  }

  return (
    <PeopleTabs
      initialTab={tab}
      initialTotal={counts.total}
      applicantCounts={{
        all: counts.applicantAll,
        pending_payment: counts.applicantPendingPayment,
        pending_approval: counts.applicantPendingApproval,
      }}
      studentCounts={{
        all: counts.studentAll,
        active: counts.studentActive,
        suspended: counts.studentSuspended,
        archived: counts.studentArchived,
      }}
    />
  )
}
