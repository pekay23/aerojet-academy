import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => <div data-testid="alert" data-variant={variant}>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
  AlertTitle: ({ children }: any) => <span>{children}</span>,
}))

describe('ErrorMessage', () => {
  it('renders message with default title', () => {
    render(<ErrorMessage message="Something went wrong" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(<ErrorMessage title="Network Error" message="Connection failed" />)
    expect(screen.getByText('Network Error')).toBeInTheDocument()
  })

  it('renders retry button when retry prop provided', () => {
    const retryFn = vi.fn()
    render(<ErrorMessage message="Failed" retry={retryFn} />)
    const retryBtn = screen.getByText('Try again')
    expect(retryBtn).toBeInTheDocument()
    fireEvent.click(retryBtn)
    expect(retryFn).toHaveBeenCalledTimes(1)
  })

  it('does not render retry button without retry prop', () => {
    render(<ErrorMessage message="Failed" />)
    expect(screen.queryByText('Try again')).not.toBeInTheDocument()
  })
})
