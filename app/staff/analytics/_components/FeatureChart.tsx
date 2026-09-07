'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface FeatureChartProps {
  data: {
    feature: string
    totalUsers: number
    adopters: number
    adoptionRate: number
    avgTimeToAdoptDays: number | null
  }
}

const featureChartConfig = {
  adopters: {
    label: 'Adopters',
    color: '#002a5c',
  },
  nonAdopters: {
    label: 'Non-Adopters',
    color: '#e5e7eb',
  },
} as const

export default function FeatureChart({ data }: FeatureChartProps) {
  const chartData = [
    { name: 'Adopters', value: data.adopters, fill: '#002a5c' },
    { name: 'Non-Adopters', value: data.totalUsers - data.adopters, fill: '#e5e7eb' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Adoption Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-aerojet-blue dark:text-aerojet-sky">{data.adoptionRate}%</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {data.adopters.toLocaleString()} of {data.totalUsers.toLocaleString()} users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Avg Time to Adopt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-aerojet-blue dark:text-aerojet-sky">
            {data.avgTimeToAdoptDays !== null ? `${data.avgTimeToAdoptDays}d` : 'N/A'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Days from signup to first use</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Non-Adopters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-red-600 dark:text-red-400">
            {data.totalUsers - data.adopters}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Users who haven&apos;t tried this feature</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Adoption Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={featureChartConfig} className="h-[250px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" formatter={(value: unknown, _name: unknown) => Number(value ?? 0).toLocaleString()} />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
