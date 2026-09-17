import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders default spinner', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.firstChild as HTMLElement
    expect(spinner).toHaveClass('animate-spin')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('renders small spinner', () => {
    const { container } = render(<LoadingSpinner size="sm" />)
    const spinner = container.firstChild as HTMLElement
    expect(spinner).toHaveClass('h-4', 'w-4')
  })

  it('renders large spinner', () => {
    const { container } = render(<LoadingSpinner size="lg" />)
    const spinner = container.firstChild as HTMLElement
    expect(spinner).toHaveClass('h-12', 'w-12')
  })

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />)
    const spinner = container.firstChild as HTMLElement
    expect(spinner).toHaveClass('custom-class')
  })
})
