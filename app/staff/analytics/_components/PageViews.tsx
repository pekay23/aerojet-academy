'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageViewsTable } from './PageViewsTable'

export function PageViews() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadPageViews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)

      const res = await fetch(`/api/staff/analytics/pageviews?${params}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to load page views:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load last 7 days by default
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    setFrom(sevenDaysAgo.toISOString().split('T')[0])
    setTo(new Date().toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (from && to) {
      loadPageViews()
    }
  }, [from, to])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Page Views</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            <Button onClick={loadPageViews} disabled={loading}>
              {loading ? 'Loading...' : 'Apply'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && <PageViewsTable data={data} />}
    </div>
  )
}
export default PageViews;
