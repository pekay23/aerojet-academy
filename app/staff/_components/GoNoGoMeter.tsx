'use client'

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface GoNoGoMeterProps {
  currentRevenue: number
  targetRevenue: number
  confirmedSeats: number
  totalSeats: number
  paymentDeadline: Date | string
  poolName?: string
}

export default function GoNoGoMeter({
  currentRevenue,
  targetRevenue,
  confirmedSeats,
  totalSeats,
  paymentDeadline,
  poolName,
}: GoNoGoMeterProps) {
  const progress = Math.min((currentRevenue / targetRevenue) * 100, 100)
  const isGo = currentRevenue >= targetRevenue
  const isNearDeadline = new Date(paymentDeadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000

  const deadlineStr = new Date(paymentDeadline).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const progressColor = isGo ? 'bg-emerald-500' : progress >= 75 ? 'bg-amber-500' : 'bg-red-500'

  const statusBg = isGo
    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50'
    : isNearDeadline
      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
      : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'

  return (
    <div className={`rounded-2xl border p-5 ${statusBg}`}>
      {/* Header */}
      <div className="mb-4 grid grid-cols-[1fr_auto] items-start gap-4">
        <div>
          <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
            Go / No-Go Meter
          </p>
          {poolName && (
            <h3 className="mt-0.5 text-sm font-black leading-tight text-slate-800 dark:text-white">
              {poolName}
            </h3>
          )}
        </div>
        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
            isGo ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {isGo ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
          {isGo ? 'GO' : 'NO-GO'}
        </div>
      </div>

      {/* Revenue Progress */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Revenue Progress
          </span>
          <span className="text-xs font-black text-slate-800 dark:text-white">
            €{currentRevenue.toLocaleString()} / €{targetRevenue.toLocaleString()}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full border border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/50">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {progress.toFixed(0)}% of target
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {isGo
              ? `+€${(currentRevenue - targetRevenue).toLocaleString()} over target`
              : `€${(targetRevenue - currentRevenue).toLocaleString()} remaining`}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/60 px-3 py-2.5 dark:bg-black/20">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
            Seats Filled
          </p>
          <p className="text-lg font-black text-slate-800 dark:text-white">
            {confirmedSeats}
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
              /{totalSeats}
            </span>
          </p>
        </div>
        <div
          className={`rounded-xl px-3 py-2.5 ${isNearDeadline ? 'bg-red-100 dark:bg-red-900/30' : 'bg-white/60 dark:bg-black/20'}`}
        >
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
            Deadline
          </p>
          <p
            className={`text-sm font-black ${isNearDeadline ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}
          >
            {deadlineStr}
          </p>
          {isNearDeadline && (
            <p className="text-[10px] font-bold text-red-500 dark:text-red-400">⚠ Closing soon</p>
          )}
        </div>
      </div>
    </div>
  )
}
