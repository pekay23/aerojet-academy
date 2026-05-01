'use client'

import * as React from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PoolFillChartProps {
  data: {
    name: string
    fill: number
    count: number
    capacity: number
  }[]
  title?: string
}

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
          <ResponsiveContainer width="100%" height="100%">
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
              <Tooltip
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={((value: any, name: string) => {
                  if (name === 'fill') return [`${value}%`, 'Fill Rate']
                  return [value, name]
                }) as any}
              />
              <Bar
                dataKey="fill"
                fill="#7C3AED"
                radius={[0, 4, 4, 0] as any}
                barSize={20}
                background={{
                  fill: '#F1F5F9',
                  radius: [0, 4, 4, 0] as any,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50/50" />
        )}
      </CardContent>
    </Card>
  )
}
