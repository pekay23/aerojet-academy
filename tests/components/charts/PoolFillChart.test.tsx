import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PoolFillChart } from '@/components/charts/PoolFillChart'

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Cell: () => <div data-testid="cell" />,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}))

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
}))

describe('PoolFillChart', () => {
  const data = [
    { name: 'Pool A', fill: 75, count: 15, capacity: 20 },
    { name: 'Pool B', fill: 90, count: 18, capacity: 20 },
    { name: 'Pool C', fill: 30, count: 6, capacity: 20 },
  ]

  it('renders card with default title', async () => {
    render(<PoolFillChart data={data} />)
    expect(screen.getByText('Pool Capacity Utilization')).toBeInTheDocument()
  })

  it('renders custom title', async () => {
    render(<PoolFillChart data={data} title="Custom Title" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('renders loading placeholder initially', () => {
    render(<PoolFillChart data={[]} />)
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('renders chart after mount', async () => {
    render(<PoolFillChart data={data} />)
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })
})
