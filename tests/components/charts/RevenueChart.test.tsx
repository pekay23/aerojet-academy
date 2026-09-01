import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { RevenueChart } from '@/components/charts/RevenueChart'

vi.mock('recharts', () => ({
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
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

describe('RevenueChart', () => {
  const data = [
    { name: 'Jan', total: 5000 },
    { name: 'Feb', total: 7000 },
    { name: 'Mar', total: 6000 },
  ]

  it('renders card with default title', async () => {
    render(<RevenueChart data={data} />)
    expect(screen.getByText('Revenue History')).toBeInTheDocument()
  })

  it('renders custom title', async () => {
    render(<RevenueChart data={data} title="Q1 Revenue" />)
    expect(screen.getByText('Q1 Revenue')).toBeInTheDocument()
  })

  it('renders loading placeholder initially', () => {
    render(<RevenueChart data={[]} />)
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('renders chart after mount', async () => {
    render(<RevenueChart data={data} />)
    await waitFor(() => {
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })
})
