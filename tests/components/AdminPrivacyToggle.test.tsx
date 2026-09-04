import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminPrivacyToggle from '@/components/shared/AdminPrivacyToggle'

describe('AdminPrivacyToggle', () => {
  it('renders toggle switch', () => {
    render(<AdminPrivacyToggle userId="user-1" initialShowLastSeen={false} />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('shows unchecked state when initialShowLastSeen is false', () => {
    render(<AdminPrivacyToggle userId="user-1" initialShowLastSeen={false} />)
    const switchBtn = screen.getByRole('switch')
    expect(switchBtn).toHaveAttribute('aria-checked', 'false')
  })

  it('shows checked state when initialShowLastSeen is true', () => {
    render(<AdminPrivacyToggle userId="user-1" initialShowLastSeen={true} />)
    const switchBtn = screen.getByRole('switch')
    expect(switchBtn).toHaveAttribute('aria-checked', 'true')
  })

  it('renders description text', () => {
    render(<AdminPrivacyToggle userId="user-1" initialShowLastSeen={false} />)
    expect(screen.getByText(/Admin override/)).toBeInTheDocument()
  })
})
