'use client'



interface PoolProgressBarProps {
  currentCount: number
  minCandidates: number
  maxCandidates: number
  status: string
  poolName: string
}

export function PoolProgressBar({
  currentCount,
  minCandidates,
  maxCandidates,
  status,
  poolName,
}: PoolProgressBarProps) {
  const percentage = Math.round((currentCount / maxCandidates) * 100)
  const isNearFull = currentCount >= maxCandidates - 5 // Near-full threshold ~23
  const isFull = currentCount >= maxCandidates
  const meetsMin = currentCount >= minCandidates

  const getStatusColorClass = () => {
    if (['CONFIRMED', 'LOCKED'].includes(status)) return 'text-emerald-500'
    if (isFull) return 'text-gray-500'
    if (isNearFull) return 'text-amber-400'
    return 'text-blue-500'
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'CONFIRMED':
        return '✅ Confirmed'
      case 'LOCKED':
        return '🔒 Locked'
      case 'NEAR_FULL':
        return '🟡 Near Full'
      case 'FAILED':
        return '❌ Failed'
      case 'CANCELLED':
        return '⛔ Cancelled'
      default:
        return meetsMin ? '✅ Meets Min' : '🔵 Open'
    }
  }

  const getFillClass = () => {
    if (isFull) return 'bg-gradient-to-r from-gray-500 to-gray-400'
    if (isNearFull) return 'bg-gradient-to-r from-amber-400 to-amber-300'
    if (meetsMin) return 'bg-gradient-to-r from-emerald-500 to-emerald-400'
    return 'bg-gradient-to-r from-blue-500 to-blue-400'
  }

  return (
    <div className="pool-progress mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold text-sm">{poolName}</span>
        <span className={`text-xs font-medium ${getStatusColorClass()}`}>
          {getStatusLabel()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-6 bg-[#1a1a2e] rounded-xl overflow-hidden border border-white/10">
        {/* Min threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-emerald-500/60 z-2"
          style={{ left: `${(minCandidates / maxCandidates) * 100}%` }}
          title={`Minimum: ${minCandidates}`}
        />

        {/* Fill */}
        <div
          className={`h-full ${getFillClass()} rounded-xl transition-[width] duration-500 ease-in-out flex items-center justify-center`}
          style={{ width: `${percentage}%` }}
        >
          <span className="text-[11px] font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
            {currentCount}/{maxCandidates}
          </span>
        </div>
      </div>

      <div className="flex justify-between text-[11px] text-[#888] mt-0.5">
        <span>{currentCount} candidates</span>
        <span>
          Min {minCandidates} • Max {maxCandidates}
        </span>
      </div>
    </div>
  )
}
