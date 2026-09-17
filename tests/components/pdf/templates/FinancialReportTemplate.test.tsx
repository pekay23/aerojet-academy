import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FinancialReportTemplate } from '@/components/pdf/templates/FinancialReportTemplate'
import type React from 'react'

type MockImageProps = React.ComponentProps<'img'>
type MockChildrenProps = React.PropsWithChildren

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: MockChildrenProps) => <div>{children}</div>,
  Page: ({ children }: MockChildrenProps) => <div>{children}</div>,
  View: ({ children }: MockChildrenProps) => <div>{children}</div>,
  Text: ({ children }: MockChildrenProps) => <span>{children}</span>,
  Image: (props: MockImageProps) => {
    const MockImage = 'img'
    return <MockImage alt="" {...props} />
  },
  StyleSheet: { create: () => ({}) },
}))

vi.mock('@/lib/currency', () => ({
  formatCurrency: (amount: number) => `€${amount.toLocaleString()}`,
}))

describe('FinancialReportTemplate', () => {
  const defaultProps = {
    year: 2025,
    month: 1,
    summary: {
      totalRevenue: 50000,
      revenueThisMonth: 5000,
      pendingAmount: 2000,
      avgTransactionValue: 500,
    },
    monthlyData: [{ month: 'January', revenue: 5000, count: 10 }],
    revenueByType: [{ name: 'Course A', value: 3000, percentage: 60 }],
    paymentStatus: [{ status: 'Paid', amount: 3000, count: 6 }],
  }

  it('renders without crashing', () => {
    render(<FinancialReportTemplate {...defaultProps} />)
    expect(screen.getByText('Financial Performance & Revenue Breakdown')).toBeInTheDocument()
  })

  it('renders period label', () => {
    render(<FinancialReportTemplate {...defaultProps} />)
    expect(screen.getByText('January 2025')).toBeInTheDocument()
  })

  it('renders KPI values', () => {
    render(<FinancialReportTemplate {...defaultProps} />)
    expect(screen.getByText('Executive Summary')).toBeInTheDocument()
  })

  it('renders monthly breakdown section', () => {
    render(<FinancialReportTemplate {...defaultProps} />)
    expect(screen.getByText('Monthly Breakdown — 2025')).toBeInTheDocument()
  })
})
