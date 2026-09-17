'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingUp, Users, Eye, BarChart3 } from 'lucide-react'
import type { DashboardAlert } from '@/lib/analytics/dashboard-alerts'
import { Badge } from '@/components/ui/badge'

interface BehavioralMetrics {
  totalEvents: number
  activeUsers: number
  avgSessionEvents: number
  pageViews: number
  pageViewGrowth: number
  featureAdoptionRate: number
}

interface MetricsOverviewProps {
  alerts: DashboardAlert[]
  metrics: BehavioralMetrics
}

export default function MetricsOverview({ alerts, metrics }: MetricsOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Behavioral KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Events"
          value={metrics.totalEvents.toLocaleString()}
          icon={<BarChart3 className="h-4 w-4" />}
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          label="Tracked in period"
        />
        <MetricCard
          title="Active Users"
          value={metrics.activeUsers.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          label="Unique users with events"
        />
        <MetricCard
          title="Avg Events / User"
          value={metrics.avgSessionEvents.toLocaleString()}
          icon={<TrendingUp className="h-4 w-4" />}
          color="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
          label="Engagement depth"
        />
        <MetricCard
          title="Page Views"
          value={metrics.pageViews.toLocaleString()}
          growth={metrics.pageViewGrowth}
          icon={<Eye className="h-4 w-4" />}
          color="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
          label="vs previous period"
        />
      </div>

      {/* Feature Adoption Banner */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Overall Feature Adoption</p>
              <p className="text-2xl font-black text-aerojet-blue dark:text-white">{metrics.featureAdoptionRate}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">of active users used at least one tracked feature</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 sm:w-48">
              <div
                className="h-full bg-aerojet-blue transition-all duration-500"
                style={{ width: `${Math.min(metrics.featureAdoptionRate, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-aerojet-sky" />
              Dashboard Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-4 p-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50/30 dark:bg-red-900/5'
                      : alert.severity === 'WARNING'
                        ? 'bg-amber-50/30 dark:bg-amber-900/5'
                        : 'bg-blue-50/20 dark:bg-blue-900/5'
                  }`}
                >
                  <AlertTriangle
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      alert.severity === 'CRITICAL'
                        ? 'text-red-600'
                        : alert.severity === 'WARNING'
                          ? 'text-amber-600'
                          : 'text-blue-600'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{alert.title}</p>
                      <Badge
                        variant={
                          alert.severity === 'CRITICAL'
                            ? 'destructive'
                            : alert.severity === 'WARNING'
                              ? 'default'
                              : 'secondary'
                        }
                        className="text-[10px] font-black uppercase"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{alert.description}</p>
                    {alert.href && (
                      <a href={alert.href} className="text-xs font-bold underline mt-2 inline-block text-aerojet-sky hover:text-aerojet-blue">
                        View details
                      </a>
                    )}
                  </div>
                  {alert.count !== undefined && (
                    <span className="text-2xl font-black text-slate-400 dark:text-slate-500">
                      {alert.count}
                    </span>
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

function MetricCard({ title, value, growth, icon, color, label }: { title: string; value: string; growth?: number; icon: React.ReactNode; color: string; label: string }) {
  const isPositive = (growth || 0) >= 0

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</CardTitle>
        <div className={`rounded-xl p-2 ${color}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black tracking-tight">{value}</div>
        {growth !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{growth}%
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</span>
          </div>
        )}
        {growth === undefined && (
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
        )}
      </CardContent>
    </Card>
  )
}
