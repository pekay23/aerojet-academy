'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface RevenueDataPoint {
  month: string
  revenue: number
  target?: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  currency?: string
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 shadow-xl dark:border-slate-800">
      <p className="mb-1 text-xs font-bold text-slate-400">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-sm font-black" style={{ color: entry.color }}>
          {entry.name === 'revenue' ? 'Revenue' : 'Target'}: {currency}
          {Number(entry.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function RevenueChart({ data, currency = '€' }: RevenueChartProps) {
  return (
    <div className="h-[256px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4c9ded" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4c9ded" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--aerojet-blue)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--aerojet-blue)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            className="opacity-100 dark:opacity-10"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            className="dark:[&_.recharts-cartesian-axis-tick-value]:fill-slate-500"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000
                ? `${currency}${(v / 1000).toFixed(1).replace(/\\.0$/, '')}k`
                : `${currency}${v}`
            }
            width={45}
            className="dark:[&_.recharts-cartesian-axis-tick-value]:fill-slate-500"
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          {data[0]?.target !== undefined && (
            <Area
              type="monotone"
              dataKey="target"
              stroke="var(--aerojet-blue)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#targetGradient)"
              dot={false}
            />
          )}
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#4c9ded"
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#4c9ded', strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
