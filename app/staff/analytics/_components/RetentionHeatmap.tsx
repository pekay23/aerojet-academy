'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

export function RetentionHeatmap({ data }: RetentionHeatmapProps) {
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
          <CardTitle>Retention Rates (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(value: any) => [`${value}%`, 'Retention']} />
              <Bar dataKey="d1" fill="#3b82f6" radius={[4, 4, 0, 0]} name="D1" />
              <Bar dataKey="d7" fill="#10b981" radius={[4, 4, 0, 0]} name="D7" />
              <Bar dataKey="d30" fill="#f59e0b" radius={[4, 4, 0, 0]} name="D30" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cohort Sizes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Users']} />
              <Bar dataKey="cohortSize" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
export default RetentionHeatmap;
