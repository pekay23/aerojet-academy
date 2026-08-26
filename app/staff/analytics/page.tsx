import { Suspense } from 'react'
import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { getDashboardAlerts } from '@/lib/analytics/dashboard-alerts'
import { getDashboardMetrics } from '@/lib/analytics/metrics'
import AnalyticsDashboardClient from './AnalyticsDashboardClient'

export const metadata: Metadata = { title: 'Analytics | Aerojet Academy' }

export default async function AnalyticsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  await requireStaff()
  const params = await searchParams
  const activeTab = params.tab || 'overview'

  const [alerts, metrics] = await Promise.all([
    getDashboardAlerts(),
    getDashboardMetrics('mom'),
  ])

  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsDashboardClient
        initialTab={activeTab}
        initialAlerts={alerts}
        initialMetrics={metrics}
      />
    </Suspense>
  )
}

function AnalyticsLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-sm text-slate-500">Loading analytics...</div>
    </div>
  )
}
