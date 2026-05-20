'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// Recharts emits `width(-1) height(-1)` warnings if its parent has zero
// dimensions when the dynamic chunk lands. Giving each dynamic chart a
// matching-height skeleton placeholder ensures the parent already has
// non-zero dimensions before the Recharts ResponsiveContainer first
// queries getBoundingClientRect().
const Placeholder = ({ height }: { height: number }) => (
  <div
    className="w-full animate-pulse rounded-2xl bg-slate-100/60 dark:bg-slate-800/40"
    style={{ height }}
  />
)

const EnrollmentChart = dynamic(
  () => import('@/components/charts/EnrollmentChart').then((m) => m.EnrollmentChart),
  { ssr: false, loading: () => <Placeholder height={420} /> }
)
const RevenueChart = dynamic(
  () => import('@/components/charts/RevenueChart').then((m) => m.RevenueChart),
  { ssr: false, loading: () => <Placeholder height={320} /> }
)
const PoolFillChart = dynamic(
  () => import('@/components/charts/PoolFillChart').then((m) => m.PoolFillChart),
  { ssr: false, loading: () => <Placeholder height={420} /> }
)
const AttendanceChart = dynamic(
  () => import('@/components/charts/AttendanceChart').then((m) => m.AttendanceChart),
  { ssr: false, loading: () => <Placeholder height={420} /> }
)
const ExamTrendChart = dynamic(
  () => import('@/components/charts/ExamCharts').then((m) => m.ExamTrendChart),
  { ssr: false, loading: () => <Placeholder height={420} /> }
)
const ScoreDistributionChart = dynamic(
  () => import('@/components/charts/ExamCharts').then((m) => m.ScoreDistributionChart),
  { ssr: false, loading: () => <Placeholder height={420} /> }
)
const Sparkline = dynamic(
  () => import('./Sparkline').then((m) => m.Sparkline),
  { ssr: false, loading: () => <Placeholder height={40} /> }
)

export {
  EnrollmentChart,
  RevenueChart,
  PoolFillChart,
  AttendanceChart,
  ExamTrendChart,
  ScoreDistributionChart,
  Sparkline,
}
