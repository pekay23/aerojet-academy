'use client'

import * as React from 'react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface EnrollmentChartProps {
  data: {
    courseCode: string
    courseName: string
    count: number
  }[]
  title?: string
}

const enrollmentConfig = {
  count: {
    label: 'Students',
    color: '#2563EB',
  },
} as const

export function EnrollmentChart({ data, title = 'Enrollment by Course' }: EnrollmentChartProps) {
  const [mounted, setMounted] = React.useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-87.5 w-full">
        {mounted ? (
          <ChartContainer config={enrollmentConfig} className="h-full w-full">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="courseCode"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B' }}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B' }}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name) => [value ?? 0, name ?? '']}
                  />
                }
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50/50" />
        )}
      </CardContent>
    </Card>
  )
}
