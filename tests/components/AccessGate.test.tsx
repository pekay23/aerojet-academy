import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AccessGate } from '@/components/AccessGate'

describe('AccessGate', () => {
  it('renders children when hasAccess is true', () => {
    render(
      <AccessGate hasAccess={true} feature="wallet">
        <div>Protected Content</div>
      </AccessGate>
    )
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('renders lock message when hasAccess is false', () => {
    render(
      <AccessGate hasAccess={false} feature="wallet">
        <div>Protected Content</div>
      </AccessGate>
    )
    expect(screen.getByText('Payment Required')).toBeInTheDocument()
    expect(screen.getByText(/complete your payment milestones/)).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <AccessGate hasAccess={false} feature="wallet" fallback={<div>Custom Fallback</div>}>
        <div>Protected Content</div>
      </AccessGate>
    )
    expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
  })

  it('renders payment link when no access', () => {
    render(
      <AccessGate hasAccess={false} feature="wallet">
        <div>Content</div>
      </AccessGate>
    )
    expect(screen.getByText('View Payment Options')).toBeInTheDocument()
  })
})
