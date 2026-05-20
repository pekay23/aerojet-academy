'use client'

import dynamic from 'next/dynamic'

// Dynamic re-exports keep Recharts (~200KB) out of the Reports page's initial
// bundle. Same pattern as `ReportCharts.tsx`. Each chart is its own chunk so
// only the YoY tab that renders pays the download cost.
//
// Implementation lives in `./YoYChartsInner.tsx`. Each chart targets 280px
// height — the placeholder matches to avoid Recharts width(-1)/height(-1)
// warnings during the dynamic-chunk swap.

const Placeholder = () => (
  <div className="h-[280px] w-full animate-pulse rounded-2xl bg-slate-100/60 dark:bg-slate-800/40" />
)

const YoYRevenueChart = dynamic(
  () => import('./YoYChartsInner').then((m) => m.YoYRevenueChart),
  { ssr: false, loading: () => <Placeholder /> }
)
const YoYEnrollmentChart = dynamic(
  () => import('./YoYChartsInner').then((m) => m.YoYEnrollmentChart),
  { ssr: false, loading: () => <Placeholder /> }
)
const YoYPassRateChart = dynamic(
  () => import('./YoYChartsInner').then((m) => m.YoYPassRateChart),
  { ssr: false, loading: () => <Placeholder /> }
)
const YoYStudentChart = dynamic(
  () => import('./YoYChartsInner').then((m) => m.YoYStudentChart),
  { ssr: false, loading: () => <Placeholder /> }
)

export { YoYRevenueChart, YoYEnrollmentChart, YoYPassRateChart, YoYStudentChart }
