'use client'

import * as React from 'react'
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface RevenueChartProps {
  data: { name: string; total: number }[]
  title?: string
}

const revenueConfig = {
  total: {
    label: 'Revenue',
    color: '#D97706',
  },
} as const

export function RevenueChart({ data, title = 'Revenue History' }: RevenueChartProps) {
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
          <ChartContainer config={revenueConfig} className="h-full w-full">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="name"
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
                tickFormatter={(value) => `€${value / 1000}k`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value) => [
                      `€${typeof value === 'number' ? value.toLocaleString() : value}`,
                      'Revenue',
                    ]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#D97706"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50/50" />
        )}
      </CardContent>
    </Card>
  )
}
