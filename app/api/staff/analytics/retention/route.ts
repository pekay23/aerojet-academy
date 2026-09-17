import { NextRequest } from 'next/server'
import { withErrorHandler, apiSuccess, apiError } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { getCohortRetention } from '@/lib/analytics/queries'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const url = new URL(req.url)
  const cohortRaw = url.searchParams.get('cohort')
  const cohortDate = cohortRaw ? new Date(cohortRaw) : undefined

  if (cohortDate && Number.isNaN(cohortDate.getTime())) {
    return apiError('Invalid "cohort" date format', 400)
  }

  const cohorts = await getCohortRetention(cohortDate)
  return apiSuccess({ cohorts })
})
