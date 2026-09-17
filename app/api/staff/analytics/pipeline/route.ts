import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { getEnrollmentPipeline } from '@/lib/analytics/forecasting'

export const GET = withErrorHandler(async () => {
  await requireStaff()

  const pipeline = await getEnrollmentPipeline()
  return apiSuccess({ pipeline })
})
