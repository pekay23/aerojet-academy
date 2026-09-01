import { Clock, Users, Loader2 } from 'lucide-react'
import {
  ExamPool,
  WalletInfo,
  poolStatusLabel,
  poolStatusColor,
} from './examOnlyTypes'
import { formatDate, formatTime } from '@/lib/utils/date'

interface PoolsTabProps {
  pools: ExamPool[]
  selectedModules: Record<string, string>
  onSelectedModulesChange: (next: Record<string, string>) => void
  wallet: WalletInfo | null
  joiningPool: string | null
  joiningWaitlist: string | null
  onJoinPool: (poolId: string, moduleCode: string) => void
  onJoinWaitlist: (poolId: string, moduleCode: string) => void
  fmt: (amount: number) => string
  poolPrice: number
}

export default function PoolsTab({
  pools,
  selectedModules,
  onSelectedModulesChange,
  wallet,
  joiningPool,
  joiningWaitlist,
  onJoinPool,
  onJoinWaitlist,
  fmt,
  poolPrice,
}: PoolsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Exam Bookings</h2>
        <p className="text-sm text-slate-500">
          Join a booking for €{pools.length > 0 ? Math.min(...pools.map((p) => Number(p.seatPrice))) : poolPrice} per
          seat
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{pool.name}</h3>
                <p className="text-sm text-slate-500">{pool.event.name}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${poolStatusColor[pool.status]}`}
              >
                {poolStatusLabel[pool.status]}
              </span>
            </div>

            <div className="mb-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock className="h-4 w-4" />
                <span>
                  {formatDate(pool.examDate)} at {formatTime(pool.examStartTime)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Users className="h-4 w-4" />
                <span>
                  {pool.currentMemberCount}/{pool.maxCandidates} candidates
                </span>
              </div>
            </div>

            {(() => {
              const fillPct =
                pool.maxCandidates > 0
                  ? Math.round((pool.currentMemberCount / pool.maxCandidates) * 100)
                  : 0
              return (
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-[10px] font-medium">
                    <span
                      className={
                        fillPct >= 90
                          ? 'font-bold text-red-500'
                          : fillPct >= 70
                            ? 'font-bold text-orange-500'
                            : fillPct >= 50
                              ? 'text-yellow-600'
                              : 'text-slate-400'
                      }
                    >
                      {fillPct >= 90
                        ? '🔴 Almost Full!'
                        : fillPct >= 70
                          ? '🟠 Filling Fast'
                          : fillPct >= 50
                            ? '🟡 Half Full'
                            : '🟢 Seats Available'}
                    </span>
                    <span className="text-slate-400">{fillPct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${fillPct >= 90 ? 'bg-red-500' : fillPct >= 70 ? 'bg-orange-400' : fillPct >= 50 ? 'bg-yellow-400' : 'bg-green-400'}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              )
            })()}

            {pool.allowedModules && pool.allowedModules.length > 0 && (
              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Select Module
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-aerojet-blue focus:ring-1 focus:ring-aerojet-blue dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={selectedModules[pool.id] || pool.allowedModules[0] || 'M1'}
                  onChange={(e) =>
                    onSelectedModulesChange({ ...selectedModules, [pool.id]: e.target.value })
                  }
                >
                  {(pool.allowedModules.length > 0
                    ? pool.allowedModules
                    : ['M1', 'M7', 'M8', 'M15']
                  ).map((mod) => (
                    <option key={mod} value={mod}>
                      Module {mod}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  €{Number(pool.seatPrice).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">per seat</p>
              </div>
              <button
                onClick={() => {
                  const moduleCode = selectedModules[pool.id] || pool.allowedModules?.[0] || 'M1'
                  if (pool.currentMemberCount >= pool.maxCandidates) {
                    onJoinWaitlist(pool.id, moduleCode)
                  } else {
                    onJoinPool(pool.id, moduleCode)
                  }
                }}
                disabled={
                  joiningPool === pool.id ||
                  !wallet ||
                  pool.status === 'LOCKED' ||
                  pool.status === 'FAILED' ||
                  pool.status === 'CONFIRMED'
                }
                className="rounded-lg bg-aerojet-blue px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#003875] disabled:opacity-50"
              >
                {joiningPool === pool.id || joiningWaitlist === pool.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : pool.status === 'LOCKED' ? (
                  'Locked'
                ) : pool.status === 'FAILED' ? (
                  'Cancelled'
                ) : pool.currentMemberCount >= pool.maxCandidates ? (
                  'Join Waitlist'
                ) : (
                  'Join Booking'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {pools.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No exam bookings available at this time</p>
        </div>
      )}
    </div>
  )
}
