import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  Legend: ({ children }: any) => <div>{children}</div>,
}))

describe('Chart', () => {
  const mockConfig = {
    revenue: { label: 'Revenue', color: '#4A72E8' },
    expenses: { label: 'Expenses', color: '#FF4F33' },
  }

  it('renders chart container', () => {
    render(
      <ChartContainer config={mockConfig}>
        <div>Chart content</div>
      </ChartContainer>
    )
    expect(screen.getByText('Chart content')).toBeInTheDocument()
  })

  it('renders tooltip content when active', () => {
    const mockPayload = [{ name: 'revenue', value: 1000, data: '#4A72E8', dataKey: 'revenue' }]
    render(
      <ChartContainer config={mockConfig}>
        <ChartTooltipContent active={true} payload={mockPayload as any} config={mockConfig} />
      </ChartContainer>
    )
    expect(screen.getByText('1,000')).toBeInTheDocument()
  })

  it('returns null when not active', () => {
    const { container } = render(
      <ChartContainer config={mockConfig}>
        <ChartTooltipContent active={false} payload={[]} config={mockConfig} />
      </ChartContainer>
    )
    expect(screen.queryByText('1,000')).not.toBeInTheDocument()
  })
})
