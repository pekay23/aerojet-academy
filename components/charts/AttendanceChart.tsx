'use client'

import * as React from 'react'
import { PieChart, Pie, Cell, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

interface AttendanceChartProps {
  data: { name: string; value: number }[]
  title?: string
}

const COLORS = ['#22C55E', '#EF4444', '#EAB308', '#3B82F6']

const attendanceConfig = {
  value: {
    label: 'Attendance',
  },
} satisfies ChartConfig

export function AttendanceChart({ data, title = 'Attendance Overview' }: AttendanceChartProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] w-full">
        {mounted ? (
          <ChartContainer config={attendanceConfig} className="h-full w-full">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value: any, name: any) => [value ?? 0, name] as any}
                  />
                }
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50/50" />
        )}
      </CardContent>
    </Card>
  )
}
