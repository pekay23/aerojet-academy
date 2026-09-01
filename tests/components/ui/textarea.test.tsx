import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea', () => {
  it('renders without crashing', () => {
    render(<Textarea placeholder="Enter description" />)
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Textarea className="custom-textarea" />)
    expect(screen.getByRole('textbox').className).toContain('custom-textarea')
  })

  it('renders disabled', () => {
    render(<Textarea disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('renders with value', () => {
    render(<Textarea value="Hello" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('Hello')
  })
})
