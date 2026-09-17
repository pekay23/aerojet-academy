'use client'

import { Lock } from 'lucide-react'
import type { FeatureType } from '@/lib/access-control'

interface AccessGateProps {
  hasAccess: boolean
  feature: FeatureType
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AccessGate({ hasAccess, children, fallback }: AccessGateProps) {
  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800/50 dark:bg-amber-900/10">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-amber-800 dark:text-amber-200">
        Payment Required
      </h3>
      <p className="mb-4 max-w-md text-sm text-amber-700 dark:text-amber-300">
        You need to complete your payment milestones to access this feature. Please make the
        necessary payments to unlock full access to the student portal.
      </p>
      <a
        href="/student/wallet?tab=payments"
        className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
      >
        View Payment Options
      </a>
    </div>
  )
}

interface AccessGateServerProps {
  feature: FeatureType
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AccessGateServer({ feature, children, fallback }: AccessGateServerProps) {
  return (
    <AccessGate hasAccess={true} feature={feature} fallback={fallback}>
      {children}
    </AccessGate>
  )
}
