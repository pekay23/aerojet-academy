import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CopyButton } from '@/components/shared/CopyButton'

describe('CopyButton', () => {
  it('renders copy button', () => {
    render(<CopyButton value="test-value" />)
    expect(screen.getByText('Copy')).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    const { container } = render(<CopyButton value="test" className="custom-class" />)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('custom-class')
  })
})
