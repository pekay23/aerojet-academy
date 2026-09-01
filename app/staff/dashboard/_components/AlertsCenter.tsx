'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertOctagon, AlertTriangle, Info, ArrowRight } from 'lucide-react'

interface DashboardAlert {
  id: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  title: string
  description: string
  href?: string
  count?: number
}

const SEVERITY_STYLE: Record<DashboardAlert['severity'], { bg: string; text: string; Icon: React.ComponentType<{ className?: string }> }> = {
  CRITICAL: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', Icon: AlertOctagon },
  WARNING: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', Icon: AlertTriangle },
  INFO: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', Icon: Info },
}

/**
 * Auto-refreshes every 60s by calling router.refresh(), which re-runs the
 * server component that fetched `initialAlerts`. The 5-minute unstable_cache
 * absorbs the cost — most ticks are cache hits.
 */
export default function AlertsCenter({ initialAlerts }: { initialAlerts: DashboardAlert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [, startTransition] = useTransition()
  const router = useRouter()

  // Keep state in sync when the server re-fetches.
  useEffect(() => setAlerts(initialAlerts), [initialAlerts])

  useEffect(() => {
    const id = setInterval(() => {
      startTransition(() => router.refresh())
    }, 60_000)
    return () => clearInterval(id)
  }, [router])

  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-center text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
        🎉 No active alerts.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const { bg, text, Icon } = SEVERITY_STYLE[a.severity]
        const Wrapper = a.href ? 'a' : 'div'
        return (
          <Wrapper
            key={a.id}
            {...(a.href ? { href: a.href } : {})}
            className={`flex items-center justify-center gap-3 rounded-2xl border border-slate-100 p-4 dark:border-slate-800 ${bg} ${a.href ? 'cursor-pointer hover:shadow-sm' : ''}`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${text}`} />
            <div className="text-center">
              <p className={`text-sm font-bold ${text}`}>{a.title}</p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{a.description}</p>
            </div>
            {a.href && <ArrowRight className={`h-4 w-4 ${text}`} />}
          </Wrapper>
        )
      })}
    </div>
  )
}
