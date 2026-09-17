import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AttendanceChart } from '@/components/charts/AttendanceChart'

vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Legend: () => <div data-testid="legend" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
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

describe('AttendanceChart', () => {
  it('renders card with title', async () => {
    render(<AttendanceChart data={[{ name: 'Present', value: 10 }, { name: 'Absent', value: 2 }]} title="Test Attendance" />)
    expect(screen.getByText('Test Attendance')).toBeInTheDocument()
  })

  it('renders loading placeholder initially', () => {
    render(<AttendanceChart data={[]} />)
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('renders chart after mount', async () => {
    render(<AttendanceChart data={[{ name: 'Present', value: 10 }, { name: 'Absent', value: 2 }]} />)
    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })
  })

  it('uses default title', async () => {
    render(<AttendanceChart data={[]} />)
    expect(screen.getByText('Attendance Overview')).toBeInTheDocument()
  })
})
