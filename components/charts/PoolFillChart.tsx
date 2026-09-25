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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-87.5 w-full">
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
                  formatter={(value, name) => {
                    if (name === 'fill') return [`${Number(value ?? 0)}%`, 'Fill Rate']
                    return [value ?? 0, name ?? '']
                  }}
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
      </CardContent>
    </Card>
  )
}
