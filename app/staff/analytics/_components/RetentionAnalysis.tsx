'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalendarIcon, Users } from 'lucide-react'
import { toast } from 'sonner'
import RetentionHeatmap from './RetentionHeatmap'

export default function RetentionAnalysis() {
  const [cohort, setCohort] = useState(() => {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    return threeMonthsAgo.toISOString().slice(0, 7)
  })
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadRetention = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (cohort) params.set('cohort', cohort)

      const res = await fetch(`/api/staff/analytics/retention?${params}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (_err) {
      toast.error('Failed to load retention data')
    } finally {
      setLoading(false)
    }
  }, [cohort])

  const didInitRef = useRef(false)
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true
      loadRetention()
    }
  }, [loadRetention])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-aerojet-sky" />
            Cohort Retention
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track how many users return after signing up
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cohort Month</label>
              <div className="relative">
                <Input
                  type="month"
                  value={cohort}
                  onChange={(e) => setCohort(e.target.value)}
                  className="w-48 rounded-xl border-slate-200 bg-white pl-10 pr-3 font-bold dark:border-slate-700 dark:bg-slate-900"
                />
                <CalendarIcon className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <Button onClick={loadRetention} disabled={loading} className="rounded-xl bg-aerojet-blue font-black hover:bg-aerojet-blue/90">
              {loading ? 'Loading...' : 'Load'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && <RetentionHeatmap data={data} />}
    </div>
  )
}
