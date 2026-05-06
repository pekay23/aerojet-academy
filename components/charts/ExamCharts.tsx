'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  Cell,
} from 'recharts'

interface ExamTrendChartProps {
  data: { month: string; exams: number; passes: number; fails: number }[]
}

export function ExamTrendChart({ data }: ExamTrendChartProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <div className="h-[300px] w-full">
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
            <Tooltip
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontWeight: 700 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="exams" fill="#818CF8" radius={[4, 4, 0, 0]} barSize={20} name="Total Exams" />
            <Line
              type="monotone"
              dataKey="passes"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Passes"
            />
            <Line
              type="monotone"
              dataKey="fails"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Fails"
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-50/50" />
      )}
    </div>
  )
}

interface ScoreDistributionChartProps {
  data: { range: string; count: number; color: string }[]
}

export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <div className="h-[260px] w-full">
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
            <Tooltip
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
              }}
              formatter={((value: any) => [value, 'Exams']) as any}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={48}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-50/50" />
      )}
    </div>
  )
}

