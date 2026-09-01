import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SubmitButton } from '@/components/forms/SubmitButton'

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/shared/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: any) => <div data-testid="spinner" data-size={size} />,
}))

describe('SubmitButton', () => {
  it('renders children', () => {
    render(<SubmitButton>Submit</SubmitButton>)
    expect(screen.getByText('Submit')).toBeInTheDocument()
  })

  it('renders loading spinner when loading', () => {
    render(<SubmitButton loading={true}>Submit</SubmitButton>)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('is disabled when loading', () => {
    render(<SubmitButton loading={true}>Submit</SubmitButton>)
    expect(screen.getByText('Submit').closest('button')).toBeDisabled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<SubmitButton disabled={true}>Submit</SubmitButton>)
    expect(screen.getByText('Submit').closest('button')).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<SubmitButton className="custom-btn">Submit</SubmitButton>)
    expect(screen.getByText('Submit').closest('button')?.className).toContain('custom-btn')
  })

  it('renders with different variant', () => {
    render(<SubmitButton variant="destructive">Delete</SubmitButton>)
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })
})
