'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarRange, Sparkles, X, ChevronRight, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function PeriodFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const period = searchParams.get('period') || 'mom'
  const [showCustom, setShowCustom] = useState(period === 'custom')
  const [fromDate, setFromDate] = useState(searchParams.get('from') || '')
  const [toDate, setToDate] = useState(searchParams.get('to') || '')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowCustom(period === 'custom')
  }, [period])

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      setShowCustom(true)
      return
    }

    setShowCustom(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', value)
    params.delete('from')
    params.delete('to')
    router.push(`/staff/reports?${params.toString()}`, { scroll: false })
  }

  const applyCustomRange = () => {
    if (!fromDate || !toDate) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', 'custom')
    params.set('from', fromDate)
    params.set('to', toDate)
    router.push(`/staff/reports?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
      {showCustom && (
        <div className="animate-in fade-in slide-in-from-right-4 flex items-center gap-2 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-aerojet-blue focus:ring-aerojet-blue/20 rounded-xl border-none bg-slate-50 px-3 py-2 text-xs font-bold focus:ring-2 dark:bg-slate-800 dark:text-white"
          />
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-aerojet-blue focus:ring-aerojet-blue/20 rounded-xl border-none bg-slate-50 px-3 py-2 text-xs font-bold focus:ring-2 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={applyCustomRange}
            disabled={!fromDate || !toDate}
            className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex h-8 items-center justify-center rounded-xl px-4 text-xs font-black text-white disabled:opacity-30"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setShowCustom(false)
              handlePeriodChange('mom')
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <CalendarRange className="h-5 w-5" />
        </div>
        <Select value={showCustom ? 'custom' : period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="text-aerojet-blue hover:border-aerojet-blue/30 w-[200px] rounded-xl border-slate-100 bg-white font-black shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
            <div className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Standard Intervals
            </div>
            <SelectItem value="mom" className="font-bold">
              Last 30 Days (MoW)
            </SelectItem>
            <SelectItem value="wow" className="font-bold">
              Last 7 Days (WoW)
            </SelectItem>
            <SelectItem value="yoy" className="font-bold">
              Year on Year (YoY)
            </SelectItem>

            <div className="mt-2 border-t border-slate-50 px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:border-slate-800">
              Intraday Granularity
            </div>
            <SelectItem value="day" className="font-bold">
              Last 24 Hours
            </SelectItem>
            <SelectItem value="4h" className="font-bold">
              Last 4 Hours
            </SelectItem>
            <SelectItem value="1h" className="font-bold">
              Last Hour
            </SelectItem>

            <div className="mt-2 border-t border-slate-50 px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:border-slate-800">
              Advanced Tools
            </div>
            <SelectItem
              value="custom"
              className="text-aerojet-sky flex items-center gap-2 font-bold"
            >
              <Sparkles className="mr-2 inline h-3 w-3" />
              Customizable Range...
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-xs font-black text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuItem asChild>
            <a href="/api/staff/export?type=students">Export Students CSV</a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/api/staff/export?type=pools">Export Exam Pools CSV</a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/api/staff/export?type=finances">Export Financials CSV</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
