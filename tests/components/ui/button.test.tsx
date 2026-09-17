import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('renders as button element', () => {
    render(<Button>Submit</Button>)
    expect(screen.getByText('Submit').tagName).toBe('BUTTON')
  })

  it('renders disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('renders with type submit', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByText('Submit')).toHaveAttribute('type', 'submit')
  })

  it('renders as child when asChild is true', () => {
    render(<Button asChild><a href="/test">Link</a></Button>)
    expect(screen.getByText('Link').tagName).toBe('A')
  })
})
