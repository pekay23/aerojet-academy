'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FunnelChartProps {
  data: {
    name: string
    steps: Array<{
      event: string
      label: string
      count: number
      conversionRate: number
      dropoffRate: number
    }>
    overallConversion: number
  }
}

export default function FunnelChart({ data }: FunnelChartProps) {
  const chartData = data.steps.map((step) => ({
    name: step.label,
    count: step.count,
    conversionRate: step.conversionRate,
    dropoffRate: step.dropoffRate,
  }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Funnel Steps ({data.name})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: any, name: string) => [
                  name === 'count' ? value.toLocaleString() : `${value}%`,
                  name === 'count' ? 'Users' : name === 'conversionRate' ? 'Conversion' : 'Drop-off',
                ]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(value: any) => [`${value}%`, 'Conversion Rate']} />
              <Bar dataKey="conversionRate" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Overall Conversion: {data.overallConversion}%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.steps.map((step, i) => (
              <div key={step.event} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium truncate">{step.label}</div>
                <div className="flex-1">
                  <div className="h-8 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${step.conversionRate}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right text-sm">{step.count.toLocaleString()}</div>
                <div className="w-20 text-right text-sm text-slate-600">
                  {i > 0 && <span className="text-red-600">-{step.dropoffRate}%</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
