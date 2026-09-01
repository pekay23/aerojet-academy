import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { getDashboardAlerts } from '@/lib/analytics/dashboard-alerts'
import { getDashboardMetrics } from '@/lib/analytics/metrics'

export const GET = withErrorHandler(async () => {
  await requireStaff()
  const [alerts, metrics] = await Promise.all([
    getDashboardAlerts(),
    getDashboardMetrics('mom'),
  ])

  return apiSuccess({
    alerts,
    metrics,
  })
})
