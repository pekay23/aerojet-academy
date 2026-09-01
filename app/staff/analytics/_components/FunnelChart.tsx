'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { TrendingDown, Users, Target, Activity, ArrowDown, Loader2 } from 'lucide-react'

interface FunnelChartProps {
  data: {
    name: string
    steps: Array<{
      event: string
      label: string
      count: number
      conversionRate: number
      dropoffRate: number
    }>
    overallConversion: number
  }
}

const COLORS = ['#002a5c', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const FUNNEL_CONFIG = {
  count: { label: 'Users', color: '#002a5c' },
} as const

const CONVERSION_CONFIG = {
  conversionRate: { label: 'Conversion Rate', color: '#002a5c' },
} as const

function getConversionColor(rate: number): string {
  if (rate >= 70) return '#10b981'
  if (rate >= 40) return '#f59e0b'
  return '#ef4444'
}

function getDropoffSeverity(rate: number): 'low' | 'medium' | 'high' {
  if (rate <= 20) return 'low'
  if (rate <= 45) return 'medium'
  return 'high'
}

function getSeverityStyles(severity: 'low' | 'medium' | 'high' | 'none'): string {
  switch (severity) {
    case 'none':
      return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300'
    case 'low':
      return 'border-green-200 bg-green-50 text-green-800 dark:border-green-800/60 dark:bg-green-900/15 dark:text-green-300'
    case 'medium':
      return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/15 dark:text-amber-300'
    case 'high':
      return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-900/15 dark:text-red-300'
  }
}

function getIconColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low':
      return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    case 'medium':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
    case 'high':
      return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  }
}

function getDropoffTextColor(severity: 'low' | 'medium' | 'high' | 'none'): string {
  switch (severity) {
    case 'none':
      return 'text-slate-600 dark:text-slate-400'
    case 'low':
      return 'text-green-600 dark:text-green-400'
    case 'medium':
      return 'text-amber-600 dark:text-amber-400'
    case 'high':
      return 'text-red-600 dark:text-red-400'
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

const FunnelChart = memo(function FunnelChart({ data }: FunnelChartProps) {
  const [mounted, setMounted] = useState(false)
  const steps = data?.steps ?? []

  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = useMemo(() =>
    steps.map((step) => ({
      name: step.label,
      count: step.count,
      conversionRate: clamp(step.conversionRate, 0, 100),
      dropoffRate: clamp(step.dropoffRate, 0, 100),
    })),
    [steps]
  )

  const firstCount = useMemo(() => steps[0]?.count ?? 0, [steps])

  const biggestDropoff = useMemo(() => {
    if (steps.length <= 1) return null
    return steps.slice(1).reduce((max, step) =>
      step.dropoffRate > max.dropoffRate ? step : max,
      steps[1]
    )
  }, [steps])

  if (!mounted) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading funnel chart">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-64 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (steps.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-slate-400" role="status" aria-live="polite">
          <Activity className="mb-2 h-8 w-8" aria-hidden="true" />
          <p className="text-sm font-medium">No funnel data for this period</p>
          <p className="text-xs">Try widening the date range or selecting a different funnel</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                <Target className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Overall Conversion Rate</p>
            </div>
            <p className="text-2xl font-black tracking-tight text-aerojet-blue">{data.overallConversion}%</p>
            <p className="text-xs text-slate-400">Conversion</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Users className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Users at First Step</p>
            </div>
            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{firstCount.toLocaleString()}</p>
            <p className="text-xs text-slate-400">At first step</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                <Activity className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Funnel Steps</p>
            </div>
            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{steps.length}</p>
            <p className="text-xs text-slate-400">In funnel</p>
          </CardContent>
        </Card>
        {biggestDropoff && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${getIconColor(getDropoffSeverity(biggestDropoff.dropoffRate))}`}>
                  <TrendingDown className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Biggest Dropoff Rate</p>
              </div>
              <p className={`text-2xl font-black tracking-tight ${getDropoffTextColor(getDropoffSeverity(biggestDropoff.dropoffRate))}`}>{biggestDropoff.dropoffRate}%</p>
              <p className="text-xs text-slate-400 truncate">{biggestDropoff.label}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Users by Step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={FUNNEL_CONFIG} className="h-64 w-full" aria-label="Horizontal bar chart showing users at each funnel step">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
                <ChartTooltip
                  content={<ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name) => {
                      if (name === 'count') return [Number(value ?? 0).toLocaleString(), 'Users']
                      return [value, name]
                    }}
                  />}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Conversion Rate by Step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={CONVERSION_CONFIG} className="h-64 w-full" aria-label="Bar chart showing conversion rate percentage at each funnel step">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <ChartTooltip
                  content={<ChartTooltipContent
                    indicator="dot"
                    formatter={(value) => [`${Number(value ?? 0)}%`, 'Conversion Rate']}
                  />}
                />
                <Bar dataKey="conversionRate" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getConversionColor(entry.conversionRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Visual Funnel Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Funnel Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {steps.map((step, i) => {
              const severity = i === 0 ? 'none' : getDropoffSeverity(step.dropoffRate)
              return (
                <div key={step.event}>
                  <div className={`rounded-lg border p-3 transition-colors ${getSeverityStyles(severity)}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/50 text-xs font-black">
                        {i + 1}
                      </span>
                      <span className="text-sm font-bold">{step.label}</span>
                      <span className="ml-auto text-sm font-black" aria-label={`${step.count.toLocaleString()} users`}>{step.count.toLocaleString()}</span>
                      <span className="text-xs font-medium">
                        {i === 0 ? '100%' : `${step.conversionRate}%`}
                      </span>
                      {i > 0 && (
                        <span className={`rounded-full bg-white/50 px-2 py-0.5 text-xs font-bold ${getDropoffTextColor(severity)}`}>
                          {step.dropoffRate}%
                        </span>
                      )}
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

export default FunnelChart
