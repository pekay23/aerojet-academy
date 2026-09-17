'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface RetentionHeatmapProps {
  data: {
    cohorts: Array<{
      cohortDate: string
      cohortSize: number
      d1: { count: number; rate: number }
      d7: { count: number; rate: number }
      d30: { count: number; rate: number }
    }>
  }
}

const retentionConfig = {
  d1: {
    label: 'D1',
    color: '#002a5c',
  },
  d7: {
    label: 'D7',
    color: '#10b981',
  },
  d30: {
    label: 'D30',
    color: '#f59e0b',
  },
} as const

const cohortConfig = {
  cohortSize: {
    label: 'Cohort Size',
    color: '#002a5c',
  },
} as const

const retentionFormatter = (value: unknown, _name: unknown): React.ReactNode => {
  const numValue = Number(value ?? 0)
  return numValue !== 0 ? `${numValue}%` : '0%'
}

const cohortSizeFormatter = (value: unknown): React.ReactNode => {
  return Number(value ?? 0).toLocaleString()
}

export default function RetentionHeatmap({ data }: RetentionHeatmapProps) {
  const chartData = data.cohorts.map((cohort) => {
    const date = new Date(cohort.cohortDate)
    const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    return {
      name: label,
      cohortSize: cohort.cohortSize,
      d1: cohort.d1.rate,
      d7: cohort.d7.rate,
      d30: cohort.d30.rate,
    }
  })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Retention Rates (%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={retentionConfig} className="h-75 w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" formatter={retentionFormatter} />} />
              <Bar dataKey="d1" fill="var(--color-d1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="d7" fill="var(--color-d7)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="d30" fill="var(--color-d30)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cohort Sizes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cohortConfig} className="h-75 w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" formatter={cohortSizeFormatter} />} />
              <Bar dataKey="cohortSize" fill="var(--color-cohortSize)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
