import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ExamTrendChart, ScoreDistributionChart } from '@/components/charts/ExamCharts'

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
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

describe('ExamTrendChart', () => {
  const data = [
    { month: 'Jan', exams: 10, passes: 8, fails: 2 },
    { month: 'Feb', exams: 12, passes: 10, fails: 2 },
  ]

  it('renders loading placeholder initially', () => {
    render(<ExamTrendChart data={[]} />)
    expect(screen.getByTestId('chart-container')).toBeInTheDocument()
  })

  it('renders chart after mount', async () => {
    render(<ExamTrendChart data={data} />)
    await waitFor(() => {
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
    })
  })
})

describe('ScoreDistributionChart', () => {
  const data = [
    { range: '0-20', count: 1, color: '#EF4444' },
    { range: '21-40', count: 2, color: '#F59E0B' },
  ]

  it('renders loading placeholder initially', () => {
    render(<ScoreDistributionChart data={[]} />)
    expect(screen.getByTestId('chart-container')).toBeInTheDocument()
  })

  it('renders chart after mount', async () => {
    render(<ScoreDistributionChart data={data} />)
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })
})
