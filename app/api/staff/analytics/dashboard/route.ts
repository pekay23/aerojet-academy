import { NextResponse } from 'next/server'
import { getDashboardAlerts } from '@/lib/analytics/dashboard-alerts'
import { getDashboardMetrics } from '@/lib/analytics/metrics'

export const GET = withErrorHandler(async () => {
  const [alerts, metrics] = await Promise.all([
    getDashboardAlerts(),
    getDashboardMetrics('mom'),
  ])

  return apiSuccess({
    alerts,
    metrics,
  })
})
