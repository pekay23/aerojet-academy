'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Globe, ShieldCheck, AlertCircle, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

interface RateData {
  rates: Record<string, number>
  external: Record<string, number>
  manual: Record<string, number>
  sources: Record<string, 'admin' | 'auto'>
  base: string
  timestamp: number
}

export default function ExchangeRateDisplay() {
  const [data, setData] = useState<RateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/rates')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        toast.error('Failed to fetch live exchange rates')
      }
    } catch (error) {
      console.error('Error fetching rates:', error)
      toast.error('Error connecting to rates service')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRates()
  }, [fetchRates])

  const handleManualRefresh = () => {
    setRefreshing(true)
    fetchRates()
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-slate-200/60 bg-white/50 dark:border-white/5 dark:bg-slate-900/50">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!data) return null

  const currencies = ['GHS', 'USD']

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm transition-all dark:border-white/5 dark:bg-[#111827]/60">
      <div className="flex items-center justify-between border-b border-slate-100/60 px-6 py-4 dark:border-white/5">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-aerojet-blue dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Market Rate Comparison</h3>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="divide-y divide-slate-100/60 dark:divide-white/5">
        {currencies.map((curr) => {
          const used = data.rates[curr]
          const live = data.external[curr]
          const source = data.sources[curr]
          const isManual = source === 'admin'
          
          // Calculate diff
          const diff = live ? ((used - live) / live) * 100 : 0
          const isHigher = diff > 0.01
          const isLower = diff < -0.01

          return (
            <div key={curr} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  {curr}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.base} to {curr}</span>
                    {isManual ? (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        Manual
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                        <RefreshCw className="h-2.5 w-2.5" />
                        Linked
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {isManual ? 'Currently using administrative override' : 'Synchronized with market rates'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 sm:flex sm:items-center sm:gap-12">
                <div className="text-right sm:text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Used Rate</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {used.toFixed(4)}
                  </p>
                </div>
                <div className="text-right sm:text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Market Rate</p>
                  <p className="text-lg font-black text-slate-500 dark:text-slate-400">
                    {live.toFixed(4)}
                  </p>
                </div>
                <div className="col-span-2 flex items-center justify-between border-t border-slate-50 pt-3 sm:col-span-1 sm:border-none sm:pt-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Variance</span>
                  {isManual ? (
                     <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold ${
                      isHigher ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' : 
                      isLower ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 
                      'bg-slate-50 text-slate-500 dark:bg-slate-800'
                    }`}>
                      {isHigher ? <TrendingUp className="h-3 w-3" /> : isLower ? <TrendingDown className="h-3 w-3" /> : null}
                      {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-900/20">
                      Perfect Match
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-slate-50/50 px-6 py-3 dark:bg-slate-800/30">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <AlertCircle className="h-3 w-3" />
          <span>Rates are cached for 1 hour. Last updated: {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  )
}
