import { NextRequest } from 'next/server'
import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { getCohortRetention } from '@/lib/analytics/queries'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const url = new URL(req.url)
  const cohortDate = url.searchParams.get('cohort') ? new Date(url.searchParams.get('cohort')!) : undefined

  const cohorts = await getCohortRetention(cohortDate)
  return apiSuccess({ cohorts })
})
