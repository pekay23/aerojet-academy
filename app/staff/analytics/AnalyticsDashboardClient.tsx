'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import dynamic from 'next/dynamic'
import type { DashboardAlert } from '@/lib/analytics/dashboard-alerts'
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Eye,
  GitBranch,
} from 'lucide-react'

interface AnalyticsDashboardClientProps {
  initialTab: string
  initialAlerts: DashboardAlert[]
  initialMetrics: {
    totalEvents: number
    activeUsers: number
    avgSessionEvents: number
    pageViews: number
    pageViewGrowth: number
    featureAdoptionRate: number
  }
}

const TABS = [
  { value: 'overview', label: 'Overview', icon: BarChart3 },
  { value: 'funnels', label: 'Funnels', icon: Target },
  { value: 'retention', label: 'Retention', icon: Users },
  { value: 'features', label: 'Features', icon: GitBranch },
  { value: 'pageviews', label: 'Page Views', icon: Eye },
  { value: 'journey', label: 'Journey', icon: TrendingUp },
]

// S-1: lazy-load each analytics tab so heavy chart bundles are code-split
const MetricsOverview = dynamic(() => import('./_components/MetricsOverview'))
const FunnelAnalysis = dynamic(() => import('./_components/FunnelAnalysis'))
const RetentionAnalysis = dynamic(() => import('./_components/RetentionAnalysis'))
const FeatureAdoption = dynamic(() => import('./_components/FeatureAdoption'))
const PageViews = dynamic(() => import('./_components/PageViews'))
const UserJourney = dynamic(() => import('./_components/UserJourney'))

export default function AnalyticsDashboardClient({
  initialTab,
  initialAlerts,
  initialMetrics,
}: AnalyticsDashboardClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          Analytics Dashboard
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          User behavior, funnels, retention, and feature adoption
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-slate-100/80 p-1 dark:bg-slate-800/80">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-aerojet-blue data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
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
