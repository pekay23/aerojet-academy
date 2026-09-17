import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrivacyToggle from '@/components/shared/PrivacyToggle'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('PrivacyToggle', () => {
  it('renders without crashing', () => {
    render(<PrivacyToggle />)
    expect(screen.getByText('Show my last-seen time')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<PrivacyToggle />)
    expect(screen.getByText(/When off, others only see a green/)).toBeInTheDocument()
  })

  it('renders toggle switch', () => {
    render(<PrivacyToggle />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toBeInTheDocument()
  })

  it('renders privacy description text', () => {
    render(<PrivacyToggle />)
    expect(screen.getByText(/Admins can always see your last-seen/)).toBeInTheDocument()
  })
})
