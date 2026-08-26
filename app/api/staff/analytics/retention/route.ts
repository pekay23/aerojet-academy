import { NextResponse } from 'next/server'
import { getCohortRetention } from '@/lib/analytics/queries'

export const GET = withErrorHandler(async (req) => {
  const url = new URL(req.url)
  const cohortDate = url.searchParams.get('cohort') ? new Date(url.searchParams.get('cohort')!) : undefined

  const cohorts = await getCohortRetention(cohortDate)
  return apiSuccess({ cohorts })
})
