'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface FeatureChartProps {
  data: {
    feature: string
    totalUsers: number
    adopters: number
    adoptionRate: number
    avgTimeToAdoptDays: number | null
  }
}

export default function FeatureChart({ data }: FeatureChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Adoption Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data.adoptionRate}%</div>
          <p className="text-xs text-slate-500 mt-1">
            {data.adopters.toLocaleString()} of {data.totalUsers.toLocaleString()} users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Avg Time to Adopt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {data.avgTimeToAdoptDays !== null ? `${data.avgTimeToAdoptDays}d` : 'N/A'}
          </div>
          <p className="text-xs text-slate-500 mt-1">Days from signup to first use</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Non-Adopters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {data.totalUsers - data.adopters}
          </div>
          <p className="text-xs text-slate-500 mt-1">Users who haven&apos;t tried this feature</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Adoption Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={[
                { name: 'Adopters', value: data.adopters, fill: '#10b981' },
                { name: 'Non-Adopters', value: data.totalUsers - data.adopters, fill: '#e5e7eb' },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Users']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
