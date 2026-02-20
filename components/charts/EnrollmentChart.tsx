'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EnrollmentChartProps {
  data: {
    courseCode: string
    courseName: string
    count: number
  }[]
  title?: string
}

export function EnrollmentChart({ data, title = 'Enrollment by Course' }: EnrollmentChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
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
            <Tooltip
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              itemStyle={{ color: '#1E293B', fontWeight: 600 }}
              formatter={(value: number) => [value, 'Students']}
              labelStyle={{ color: '#64748B', marginBottom: '0.25rem' }}
            />
            <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
