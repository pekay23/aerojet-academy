import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Switch } from '@/components/ui/switch'
import * as React from 'react'

vi.mock('@radix-ui/react-switch', () => ({
  Root: ({ children, className, checked, onCheckedChange, ...props }: any) => {
    const [state, setState] = React.useState(!!checked)
    return (
      <button
        className={className}
        data-state={state ? 'checked' : 'unchecked'}
        onClick={() => {
          const next = !state
          setState(next)
          onCheckedChange?.(next)
        }}
        role="switch"
        aria-checked={state}
        {...props}
      >
        {children}
      </button>
    )
  },
  Thumb: ({ className }: any) => <span className={className} />,
}))

describe('Switch', () => {
  it('renders without crashing', () => {
    render(<Switch />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('toggles checked state', () => {
    render(<Switch />)
    const sw = screen.getByRole('switch')
    expect(sw.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(sw)
    expect(sw.getAttribute('aria-checked')).toBe('true')
  })

  it('renders disabled', () => {
    render(<Switch disabled />)
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Switch className="custom-switch" />)
    expect(screen.getByRole('switch').className).toContain('custom-switch')
  })
})
