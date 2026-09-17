import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { EnrollmentChart } from '@/components/charts/EnrollmentChart'

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
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

describe('EnrollmentChart', () => {
  it('renders card with title', async () => {
    render(
      <EnrollmentChart
        data={[{ courseCode: 'CS101', courseName: 'Intro', count: 25 }]}
        title="Enrollment Stats"
      />
    )
    expect(screen.getByText('Enrollment Stats')).toBeInTheDocument()
  })

  it('renders loading placeholder initially', () => {
    render(<EnrollmentChart data={[]} />)
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('renders chart after mount', async () => {
    render(
      <EnrollmentChart
        data={[{ courseCode: 'CS101', courseName: 'Intro', count: 25 }]}
      />
    )
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  it('uses default title', async () => {
    render(<EnrollmentChart data={[]} />)
    expect(screen.getByText('Enrollment by Course')).toBeInTheDocument()
  })
})
