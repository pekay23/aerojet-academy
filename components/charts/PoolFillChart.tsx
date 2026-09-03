'use client'

import * as React from 'react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface PoolFillChartProps {
  data: {
    name: string
    fill: number
    count: number
    capacity: number
  }[]
  title?: string
}

const poolFillConfig = {
  fill: {
    label: 'Fill Rate',
    color: '#7C3AED',
  },
} as const

export function PoolFillChart({ data, title = 'Pool Capacity Utilization' }: PoolFillChartProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] w-full">
        {mounted ? (
          <ChartContainer config={poolFillConfig} className="h-full w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis
                dataKey="name"
                type="category"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
                tick={{ fill: '#64748B' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={
                      ((value: number | string | undefined, name: string) => {
                        if (name === 'fill') return [`${Number(value ?? 0)}%`, 'Fill Rate'] as any
                        return [value ?? 0, name] as any
                      }) as any
                    }
                  />
                }
              />
              <Bar dataKey="fill" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill > 80 ? '#EF4444' : entry.fill > 50 ? '#F59E0B' : '#7C3AED'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50/50" />
        )}
      </CardContent>
    </Card>
  )
}
