'use client'

import dynamic from 'next/dynamic'
import React from 'react'
import type { RevenueDataPoint } from './RevenueChart'

const RevenueChart = dynamic(() => import('./RevenueChart'), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/50" />
})

interface DashboardChartsProps {
  data: RevenueDataPoint[]
  currency: string
}

export function DashboardCharts({ data, currency }: DashboardChartsProps) {
  return <RevenueChart data={data} currency={currency} />
}
