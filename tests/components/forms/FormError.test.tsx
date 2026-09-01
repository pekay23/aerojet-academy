import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormError } from '@/components/forms/FormError'

describe('FormError', () => {
  it('renders error message', () => {
    render(<FormError message="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('returns null when no message', () => {
    const { container } = render(<FormError message={undefined} />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when empty string', () => {
    const { container } = render(<FormError message="" />)
    expect(container.innerHTML).toBe('')
  })
})
