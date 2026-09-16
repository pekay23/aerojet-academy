import { withErrorHandler, apiSuccess, apiError, apiNotFound } from '@/lib/api/response'
import { getFeatureAdoption } from '@/lib/analytics/queries'

export const GET = withErrorHandler(async (req) => {
  const url = new URL(req.url)
  const feature = url.searchParams.get('feature')
  const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined
  const to = url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined

  if (!feature) {
    return apiError('Missing required parameter: feature', 400)
  }

  const metrics = await getFeatureAdoption(feature, from, to)
  if (!metrics) {
    return apiNotFound('No data found for this feature')
  }

  return apiSuccess(metrics)
})
