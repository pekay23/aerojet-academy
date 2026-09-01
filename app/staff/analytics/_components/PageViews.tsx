'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Eye } from 'lucide-react'
import PageViewsTable from './PageViewsTable'

export default function PageViews() {
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
      toast.error('Failed to load page views')
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
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-aerojet-sky" />
            Page Views
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Most visited pages and unique visitor counts
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">From</label>
              <div className="relative">
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-44 rounded-xl border-slate-200 bg-white pl-10 pr-3 font-bold dark:border-slate-700 dark:bg-slate-900"
                />
                <CalendarIcon className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">To</label>
              <div className="relative">
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-44 rounded-xl border-slate-200 bg-white pl-10 pr-3 font-bold dark:border-slate-700 dark:bg-slate-900"
                />
                <CalendarIcon className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <Button onClick={loadPageViews} disabled={loading} className="rounded-xl bg-aerojet-blue font-black hover:bg-aerojet-blue/90">
              {loading ? 'Loading...' : 'Apply'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && <PageViewsTable data={data} />}
    </div>
  )
}
