'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const EnrollmentChart = dynamic(() => import('@/components/charts/EnrollmentChart').then(m => m.EnrollmentChart), { ssr: false })
const RevenueChart = dynamic(() => import('@/components/charts/RevenueChart').then(m => m.RevenueChart), { ssr: false })
const PoolFillChart = dynamic(() => import('@/components/charts/PoolFillChart').then(m => m.PoolFillChart), { ssr: false })
const AttendanceChart = dynamic(() => import('@/components/charts/AttendanceChart').then(m => m.AttendanceChart), { ssr: false })
const ExamTrendChart = dynamic(() => import('@/components/charts/ExamCharts').then(m => m.ExamTrendChart), { ssr: false })
const ScoreDistributionChart = dynamic(() => import('@/components/charts/ExamCharts').then(m => m.ScoreDistributionChart), { ssr: false })
const Sparkline = dynamic(() => import('./Sparkline').then(m => m.Sparkline), { ssr: false })

export {
  EnrollmentChart,
  RevenueChart,
  PoolFillChart,
  AttendanceChart,
  ExamTrendChart,
  ScoreDistributionChart,
  Sparkline
}
