'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FunnelChart } from './FunnelChart'

type FunnelName = 'registration' | 'enrollment' | 'exam' | 'payment'

export default function FunnelAnalysis() {
  const [funnel, setFunnel] = useState<FunnelName>('registration')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadFunnel = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ funnel })
      if (from) params.set('from', from)
      if (to) params.set('to', to)

      const res = await fetch(`/api/staff/analytics/funnels?${params}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to load funnel:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFunnel()
  }, [funnel])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Funnel Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Select value={funnel} onValueChange={(v) => setFunnel(v as FunnelName)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registration">Registration</SelectItem>
                <SelectItem value="enrollment">Enrollment</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
              placeholder="From"
            />
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
              placeholder="To"
            />
            <Button onClick={loadFunnel} disabled={loading}>
              {loading ? 'Loading...' : 'Apply'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && <FunnelChart data={data} />}
    </div>
  )
}
