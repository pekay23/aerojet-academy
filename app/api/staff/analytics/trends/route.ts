import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { detectTrends } from '@/lib/analytics/forecasting'

export const GET = withErrorHandler(async () => {
  await requireStaff()

  const trends = await detectTrends()
  return apiSuccess({ trends })
})
