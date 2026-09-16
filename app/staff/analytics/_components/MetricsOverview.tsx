import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingUp, Users, GraduationCap, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import type { DashboardAlert } from '@/lib/analytics/dashboard-alerts'

interface MetricsOverviewProps {
  alerts: DashboardAlert[]
  metrics: any
}

export function MetricsOverview({ alerts, metrics }: MetricsOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue.value)}
          growth={metrics.totalRevenue.growth}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Students"
          value={metrics.totalStudents.value.toString()}
          growth={metrics.totalStudents.growth}
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <MetricCard
          title="Active Enrollments"
          value={metrics.activeEnrollments.value.toString()}
          growth={metrics.activeEnrollments.growth}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="Pending Payments"
          value={metrics.pendingPayments.toString()}
          icon={<AlertTriangle className="h-4 w-4" />}
          alert={metrics.pendingPayments > 10}
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    alert.severity === 'CRITICAL'
                      ? 'border-red-200 bg-red-50'
                      : alert.severity === 'WARNING'
                ? 'border-amber-200 bg-amber-50'
                : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <AlertTriangle
                    className={`h-5 w-5 shrink-0 ${
                      alert.severity === 'CRITICAL'
                        ? 'text-red-600'
                        : alert.severity === 'WARNING'
                  ? 'text-amber-600'
                  : 'text-blue-600'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{alert.description}</p>
                    {alert.href && (
                      <a href={alert.href} className="text-xs font-medium underline mt-2 inline-block">
                        View details
                      </a>
                    )}
                  </div>
                  {alert.count !== undefined && (
                    <span className="text-2xl font-bold">{alert.count}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetricCard({
  title,
  value,
  growth,
  icon,
  alert,
}: {
  title: string
  value: string
  growth?: number
  icon: React.ReactNode
  alert?: boolean
}) {
  return (
    <Card className={alert ? 'border-red-200 bg-red-50/50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={`${alert ? 'text-red-600' : 'text-slate-400'}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {growth !== undefined && (
          <p className={`text-xs ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growth >= 0 ? '+' : ''}{growth}% from previous period
          </p>
        )}
      </CardContent>
    </Card>
  )
}
export default MetricsOverview;
