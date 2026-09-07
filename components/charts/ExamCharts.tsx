'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  Line,
  ComposedChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

interface ExamTrendChartProps {
  data: { month: string; exams: number; passes: number; fails: number }[]
}

const examTrendConfig = {
  exams: {
    label: 'Total Exams',
    color: '#818CF8',
  },
  passes: {
    label: 'Passes',
    color: '#10B981',
  },
  fails: {
    label: 'Fails',
    color: '#EF4444',
  },
} satisfies ChartConfig

export function ExamTrendChart({ data }: ExamTrendChartProps) {
  const [mounted, setMounted] = React.useState(false)
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])

  return (
    <div className="h-[300px] w-full">
      {mounted ? (
        <ChartContainer config={examTrendConfig} className="h-full w-full">
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="month"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94A3B8' }}
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94A3B8' }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name) => [value ?? 0, name] as [React.ReactNode, string]}
                />
              }
            />
            <Bar dataKey="exams" fill="var(--color-exams)" radius={[4, 4, 0, 0]} barSize={20} />
            <Line
              type="monotone"
              dataKey="passes"
              stroke="var(--color-passes)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="fails"
              stroke="var(--color-fails)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ChartContainer>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-50/50" />
      )}
    </div>
  )
}

interface ScoreDistributionChartProps {
  data: { range: string; count: number; color: string }[]
}

const scoreDistributionConfig = {
  count: {
    label: 'Exams',
    color: '#818CF8',
  },
} satisfies ChartConfig

export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
   
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])

  return (
    <div className="h-[260px] w-full">
      {mounted ? (
        <ChartContainer config={scoreDistributionConfig} className="h-full w-full">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="range"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontWeight: 700 }}
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94A3B8' }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value) => [value ?? 0, 'Exams'] as [React.ReactNode, string]}
                />
              }
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={48}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-50/50" />
      )}
    </div>
  )
}
