import { getAuthSession } from '@/lib/auth/helpers'
import { detectTrends } from '@/lib/analytics/forecasting'
import { apiSuccess, apiUnauthorized, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
    return apiUnauthorized()
  }

  const trends = await detectTrends()
  return apiSuccess(trends)
})
