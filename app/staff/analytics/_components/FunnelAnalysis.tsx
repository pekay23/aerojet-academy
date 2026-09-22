'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Play, Target, Loader2 } from 'lucide-react'
import FunnelChart from './FunnelChart'
import type { FunnelMetrics } from '@/lib/analytics/queries'

type FunnelName = 'registration' | 'enrollment' | 'exam' | 'payment'

function isValidDate(value: string): boolean {
  if (!value) return false
  const date = new Date(value)
  return date instanceof Date && !Number.isNaN(date.getTime())
}

export default function FunnelAnalysis() {
  const [funnel, setFunnel] = useState<FunnelName>('registration')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<FunnelMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadFunnel = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (from && !isValidDate(from)) {
        setError('Invalid "From" date')
        setLoading(false)
        return
      }
      if (to && !isValidDate(to)) {
        setError('Invalid "To" date')
        setLoading(false)
        return
      }
      if (from && to && from >= to) {
        setError('"From" date must be before "To" date')
        setLoading(false)
        return
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      const params = new URLSearchParams({ funnel })
      if (from) params.set('from', from)
      if (to) params.set('to', to)

      const res = await fetch(`/api/staff/analytics/funnels?${params}`, {
        signal: controller.signal,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load funnel data')
      }
      setData(json.data)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      const message = err instanceof Error ? err.message : 'Failed to load funnel'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [funnel, from, to])

  useEffect(() => {
    let cancelled = false

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFunnel().then(() => {
      if (cancelled) setData(null)
    })

    return () => {
      cancelled = true
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
    }
  }, [loadFunnel])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="text-aerojet-sky h-5 w-5" aria-hidden="true" />
            Funnel Analysis
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track conversion rates across key user journeys
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black tracking-widest text-slate-400 uppercase">
                Funnel
              </label>
              <Select value={funnel} onValueChange={(v) => setFunnel(v as FunnelName)}>
                <SelectTrigger className="w-48 rounded-xl border-slate-200 bg-white font-bold dark:border-slate-700 dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="registration" className="font-bold">
                    Registration
                  </SelectItem>
                  <SelectItem value="enrollment" className="font-bold">
                    Enrollment
                  </SelectItem>
                  <SelectItem value="exam" className="font-bold">
                    Exam
                  </SelectItem>
                  <SelectItem value="payment" className="font-bold">
                    Payment
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black tracking-widest text-slate-400 uppercase">
                From
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-44 rounded-xl border-slate-200 bg-white pr-3 pl-10 font-bold dark:border-slate-700 dark:bg-slate-900"
                />
                <CalendarIcon
                  className="absolute top-2 left-3 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black tracking-widest text-slate-400 uppercase">
                To
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-44 rounded-xl border-slate-200 bg-white pr-3 pl-10 font-bold dark:border-slate-700 dark:bg-slate-900"
                />
                <CalendarIcon
                  className="absolute top-2 left-3 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
              </div>
            </div>
            <Button
              onClick={loadFunnel}
              disabled={loading}
              className="bg-aerojet-blue hover:bg-aerojet-blue/90 rounded-xl font-black"
            >
              <Play className="mr-2 h-4 w-4" aria-hidden="true" />
              {loading ? 'Loading...' : 'Apply'}
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-900/15 dark:text-red-300">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {loading && !data && (
        <div
          className="flex items-center justify-center py-8"
          aria-busy="true"
          aria-label="Loading funnel data"
        >
          <Loader2 className="text-aerojet-blue h-6 w-6 animate-spin" />
        </div>
      )}

      {data && <FunnelChart data={data} />}
    </div>
  )
}
