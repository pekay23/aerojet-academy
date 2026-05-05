import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, apiUnauthorized } from '@/lib/api/response'
import { unstable_cache } from 'next/cache'

const getCachedCounts = unstable_cache(
  async () => {
    const queryResult: any[] = await prismaUnfiltered.$queryRaw`
      SELECT
        COUNT(*)::int as "total",
        COUNT(*) FILTER (WHERE "role"::text = 'APPLICANT' AND "status"::text = 'PENDING')::int as "applicantAll",
        COUNT(*) FILTER (WHERE "role"::text = 'APPLICANT' AND "status"::text = 'PENDING' AND "registrationPaid" = false)::int as "applicantPendingPayment",
        COUNT(*) FILTER (WHERE "role"::text = 'APPLICANT' AND "status"::text = 'PENDING' AND "registrationPaid" = true)::int as "applicantPendingApproval",
        COUNT(*) FILTER (WHERE "role"::text = 'STUDENT')::int as "studentAll",
        COUNT(*) FILTER (WHERE "role"::text = 'STUDENT' AND "status"::text = 'ACTIVE')::int as "studentActive",
        COUNT(*) FILTER (WHERE "role"::text = 'STUDENT' AND "status"::text = 'SUSPENDED')::int as "studentSuspended",
        COUNT(*) FILTER (WHERE "role"::text = 'STUDENT' AND "status"::text = 'ARCHIVED')::int as "studentArchived",
        COUNT(*) FILTER (WHERE "role"::text = 'EXAMINER')::int as "examinerAll"
      FROM "users"
      WHERE "deletedAt" IS NULL
    `
    return queryResult[0] || {
      total: 0,
      applicantAll: 0,
      applicantPendingPayment: 0,
      applicantPendingApproval: 0,
      studentAll: 0,
      studentActive: 0,
      studentSuspended: 0,
      studentArchived: 0,
      examinerAll: 0,
    }
  },
  ['staff-users-counts'],
  { revalidate: 60 }
)

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return apiUnauthorized()

  const counts = await getCachedCounts()
  return apiSuccess(counts)
}
