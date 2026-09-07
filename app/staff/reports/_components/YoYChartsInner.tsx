'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import type { ReactNode } from 'react'

type TooltipFormatterValue = number | string | readonly (number | string)[] | undefined
type TooltipFormatterName = number | string | undefined
type TooltipFormatter = (value: TooltipFormatterValue, name: TooltipFormatterName) => [ReactNode, ReactNode]

function numericTooltipValue(value: TooltipFormatterValue) {
  return Number(Array.isArray(value) ? value[0] : value)
}

function shortCurrency(v: number) {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`
  return `€${v.toFixed(0)}`
}

const CURRENT_COLOR = '#1E40AF'   // aerojet blue
const PREVIOUS_COLOR = '#94A3B8'  // slate-400

type YoYChartProps = {
  data: Record<string, string | number>[]
  currentYear: number
  previousYear: number
}

function yearLabel(value: TooltipFormatterName, currentYear: number, previousYear: number): string {
  return String(value).includes(String(currentYear)) ? String(currentYear) : String(previousYear)
}

export function YoYRevenueChart({ data, currentYear, previousYear }: YoYChartProps) {
  const formatter: TooltipFormatter = (v, name) => [
    shortCurrency(numericTooltipValue(v)),
    yearLabel(name, currentYear, previousYear),
  ]
  return (
    <ResponsiveContainer width="100%" height={280} minWidth={0}>
      <BarChart data={data} barGap={2} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={formatter}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Legend formatter={(v) => yearLabel(v, currentYear, previousYear)} />
        <Bar dataKey={`${currentYear}_revenue`} fill={CURRENT_COLOR} radius={[4, 4, 0, 0]} name={`${currentYear}_revenue`} />
        <Bar dataKey={`${previousYear}_revenue`} fill={PREVIOUS_COLOR} radius={[4, 4, 0, 0]} name={`${previousYear}_revenue`} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function YoYEnrollmentChart({ data, currentYear, previousYear }: YoYChartProps) {
  const formatter: TooltipFormatter = (v, name) => [v, yearLabel(name, currentYear, previousYear)]
  return (
    <ResponsiveContainer width="100%" height={280} minWidth={0}>
      <BarChart data={data} barGap={2} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={formatter}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Legend formatter={(v) => yearLabel(v, currentYear, previousYear)} />
        <Bar dataKey={`${currentYear}_enrollments`} fill="#10B981" radius={[4, 4, 0, 0]} name={`${currentYear}_enrollments`} />
        <Bar dataKey={`${previousYear}_enrollments`} fill="#6EE7B7" radius={[4, 4, 0, 0]} name={`${previousYear}_enrollments`} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function YoYPassRateChart({ data, currentYear, previousYear }: YoYChartProps) {
  const formatter: TooltipFormatter = (v, name) => [`${v}%`, yearLabel(name, currentYear, previousYear)]
  return (
    <ResponsiveContainer width="100%" height={280} minWidth={0}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={formatter}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Legend formatter={(v) => yearLabel(v, currentYear, previousYear)} />
        <Line type="monotone" dataKey={`${currentYear}_passRate`} stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3 }} name={`${currentYear}_passRate`} />
        <Line type="monotone" dataKey={`${previousYear}_passRate`} stroke="#C4B5FD" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" name={`${previousYear}_passRate`} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function YoYStudentChart({ data, currentYear, previousYear }: YoYChartProps) {
  const formatter: TooltipFormatter = (v, name) => [v, yearLabel(name, currentYear, previousYear)]
  return (
    <ResponsiveContainer width="100%" height={280} minWidth={0}>
      <BarChart data={data} barGap={2} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={formatter}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Legend formatter={(v) => yearLabel(v, currentYear, previousYear)} />
        <Bar dataKey={`${currentYear}_newStudents`} fill="#F59E0B" radius={[4, 4, 0, 0]} name={`${currentYear}_newStudents`} />
        <Bar dataKey={`${previousYear}_newStudents`} fill="#FDE68A" radius={[4, 4, 0, 0]} name={`${previousYear}_newStudents`} />
      </BarChart>
    </ResponsiveContainer>
  )
}
