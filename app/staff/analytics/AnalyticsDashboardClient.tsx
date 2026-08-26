'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricsOverview } from './_components/MetricsOverview'
import { FunnelAnalysis } from './_components/FunnelAnalysis'
import { RetentionAnalysis } from './_components/RetentionAnalysis'
import { FeatureAdoption } from './_components/FeatureAdoption'
import { PageViews } from './_components/PageViews'
import { UserJourney } from './_components/UserJourney'
import type { DashboardAlert } from '@/lib/analytics/dashboard-alerts'

interface AnalyticsDashboardClientProps {
  initialTab: string
  initialAlerts: DashboardAlert[]
  initialMetrics: any
}

export default function AnalyticsDashboardClient({
  initialTab,
  initialAlerts,
  initialMetrics,
}: AnalyticsDashboardClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">User behavior, funnels, retention, and feature adoption</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnels">Funnels</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="pageviews">Page Views</TabsTrigger>
          <TabsTrigger value="journey">Journey</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MetricsOverview alerts={initialAlerts} metrics={initialMetrics} />
        </TabsContent>

        <TabsContent value="funnels" className="space-y-6">
          <FunnelAnalysis />
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <RetentionAnalysis />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <FeatureAdoption />
        </TabsContent>

        <TabsContent value="pageviews" className="space-y-6">
          <PageViews />
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          <UserJourney />
        </TabsContent>
      </Tabs>
    </div>
  )
}
