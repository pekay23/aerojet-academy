'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RetentionHeatmap } from './RetentionHeatmap'

export function RetentionAnalysis() {
  const [cohort, setCohort] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadRetention = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (cohort) params.set('cohort', cohort)

      const res = await fetch(`/api/staff/analytics/retention?${params}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to load retention:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load last 3 months by default
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const monthStr = threeMonthsAgo.toISOString().slice(0, 7)
    setCohort(monthStr)
    loadRetention()
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cohort Retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              type="month"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              className="w-48"
            />
            <Button onClick={loadRetention} disabled={loading}>
              {loading ? 'Loading...' : 'Load'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && <RetentionHeatmap data={data} />}
    </div>
  )
}
export default RetentionAnalysis;
