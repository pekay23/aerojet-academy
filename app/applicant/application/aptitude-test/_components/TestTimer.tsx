'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface TestTimerProps {
  expiresAt: string
  onExpire: () => void
}

export default function TestTimer({ expiresAt, onExpire }: TestTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isExpiring, setIsExpiring] = useState(false)

  useEffect(() => {
    const target = new Date(expiresAt).getTime()
    
    const tick = () => {
      const now = new Date().getTime()
      const diff = Math.max(0, Math.floor((target - now) / 1000))
      setTimeLeft(diff)

      if (diff <= 300) { // Last 5 minutes
        setIsExpiring(true)
      }

      if (diff === 0) {
        onExpire()
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, onExpire])

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-black tracking-widest ${
      isExpiring 
        ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400' 
        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
    }`}>
      <Clock className={`h-4 w-4 ${isExpiring ? 'animate-pulse' : ''}`} />
      {formatted}
    </div>
  )
}
