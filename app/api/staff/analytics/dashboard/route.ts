import { NextRequest } from 'next/server'
import { withErrorHandler, apiSuccess, apiError } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { getDashboardAlerts } from '@/lib/analytics/dashboard-alerts'
import { getBehavioralMetrics } from '@/lib/analytics/metrics'

const VALID_PERIODS = ['mom', 'yoy', 'wow', 'day', '24h', '4h', '1h', 'custom']

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const url = new URL(req.url)
  const period = url.searchParams.get('period') || 'mom'

  if (!VALID_PERIODS.includes(period)) {
    return apiError('Invalid period. Use: mom, yoy, wow, day, 24h, 4h, 1h, custom', 400)
  }

  const [alerts, metrics] = await Promise.all([getDashboardAlerts(), getBehavioralMetrics(period)])

  return apiSuccess({
    alerts,
    metrics,
  })
})
