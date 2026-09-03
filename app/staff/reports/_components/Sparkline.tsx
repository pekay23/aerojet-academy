'use client'

import * as React from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: { value: number }[]
  color?: string
}

export function Sparkline({ data, color = '#3b82f6' }: SparklineProps) {
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])

  // Generate some random-ish but stable data points if actual historical data isn't passed
  const chartData = data.length > 0 ? data : [
    { value: 10 }, { value: 25 }, { value: 15 }, { value: 35 }, 
    { value: 30 }, { value: 45 }, { value: 40 }
  ]

  return (
    <div className="h-10 w-24">
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#grad-${color})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full" />
      )}
    </div>
  )
}
