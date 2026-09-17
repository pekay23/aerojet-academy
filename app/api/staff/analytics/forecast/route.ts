import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { getRevenueForecast } from '@/lib/analytics/forecasting'

export const GET = withErrorHandler(async () => {
  await requireStaff()

  const forecast = await getRevenueForecast(6)
  return apiSuccess({ forecast })
})
