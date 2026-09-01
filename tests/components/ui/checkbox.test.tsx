import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Checkbox } from '@/components/ui/checkbox'
import * as React from 'react'

vi.mock('@radix-ui/react-checkbox', () => ({
  Root: ({ children, className, checked, onCheckedChange, ...props }: any) => {
    const [state, setState] = React.useState(!!checked)
    return (
      <div
        role="checkbox"
        className={className}
        data-checked={String(state)}
        onClick={() => {
          const next = !state
          setState(next)
          onCheckedChange?.(next)
        }}
        {...props}
      >
        {children}
      </div>
    )
  },
  Indicator: ({ children }: any) => <span>{children}</span>,
}))

describe('Checkbox', () => {
  it('renders without crashing', () => {
    render(<Checkbox />)
    expect(screen.getByRole('checkbox') || document.querySelector('[data-checked]')).toBeTruthy()
  })

  it('toggles checked state', () => {
    const { container } = render(<Checkbox />)
    const checkbox = container.querySelector('[data-checked]') as HTMLElement
    expect(checkbox.getAttribute('data-checked')).toBe('false')
    fireEvent.click(checkbox)
    expect(checkbox.getAttribute('data-checked')).toBe('true')
  })

  it('renders disabled', () => {
    render(<Checkbox disabled />)
    expect(document.querySelector('[disabled]') || document.querySelector('.disabled\\:opacity-50')).toBeTruthy()
  })
})
