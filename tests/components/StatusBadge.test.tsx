import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StatusBadge } from '@/components/shared/StatusBadge'

describe('StatusBadge', () => {
  it('renders status text with underscores replaced by spaces', () => {
    render(<StatusBadge status="PAYMENT_PENDING" />)
    expect(screen.getByText('PAYMENT PENDING')).toBeInTheDocument()
  })

  it('applies correct color class for known statuses', () => {
    const { container } = render(<StatusBadge status="APPROVED" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-green-100')
    expect(badge.className).toContain('text-green-800')
  })

  it('applies default gray for unknown statuses', () => {
    const { container } = render(<StatusBadge status="UNKNOWN_STATUS" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-gray-100')
    expect(badge.className).toContain('text-gray-800')
  })

  it('merges custom className', () => {
    const { container } = render(<StatusBadge status="ACTIVE" className="ml-2" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('ml-2')
    expect(badge.className).toContain('bg-green-100')
  })

  it('formats common statuses correctly', () => {
    const { container } = render(<StatusBadge status="ENROLLED" />)
    expect(screen.getByText('ENROLLED')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('bg-blue-100')
  })
})
