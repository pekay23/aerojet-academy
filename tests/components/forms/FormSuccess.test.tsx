import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormSuccess } from '@/components/forms/FormSuccess'

describe('FormSuccess', () => {
  it('renders success message', () => {
    render(<FormSuccess message="Saved successfully" />)
    expect(screen.getByText('Saved successfully')).toBeInTheDocument()
  })

  it('returns null when no message', () => {
    const { container } = render(<FormSuccess message={undefined} />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when empty string', () => {
    const { container } = render(<FormSuccess message="" />)
    expect(container.innerHTML).toBe('')
  })
})
