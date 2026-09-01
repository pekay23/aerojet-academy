import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorMessage } from '@/components/shared/ErrorMessage'

describe('ErrorMessage', () => {
  it('renders default title and message', () => {
    render(<ErrorMessage message="Something went wrong" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(<ErrorMessage title="Failure" message="Network error" />)
    expect(screen.getByText('Failure')).toBeInTheDocument()
  })

  it('renders retry button when retry is provided', () => {
    const retry = vi.fn()
    render(<ErrorMessage message="Error" retry={retry} />)
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('calls retry when retry button is clicked', () => {
    const retry = vi.fn()
    render(<ErrorMessage message="Error" retry={retry} />)
    fireEvent.click(screen.getByText('Try again'))
    expect(retry).toHaveBeenCalled()
  })
})
