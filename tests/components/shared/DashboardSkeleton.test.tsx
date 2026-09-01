import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardSkeleton, TableSkeleton } from '@/components/shared/DashboardSkeleton'

describe('DashboardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<DashboardSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('has loading accessibility label', () => {
    render(<DashboardSkeleton />)
    expect(screen.getByLabelText('Loading dashboard')).toBeInTheDocument()
  })

  it('renders stat cards placeholder', () => {
    const { container } = render(<DashboardSkeleton />)
    const statCards = container.querySelectorAll('.grid > div')
    expect(statCards.length).toBeGreaterThanOrEqual(4)
  })
})

describe('TableSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<TableSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders default number of rows', () => {
    const { container } = render(<TableSkeleton />)
    const rows = container.querySelectorAll('.border-b')
    expect(rows.length).toBeGreaterThanOrEqual(8)
  })

  it('renders custom number of rows', () => {
    const { container } = render(<TableSkeleton rows={3} />)
    const rows = container.querySelectorAll('.border-b')
    expect(rows.length).toBeGreaterThanOrEqual(3)
  })
})
