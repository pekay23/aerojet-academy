import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageTransition from '@/components/shared/PageTransition'

describe('PageTransition', () => {
  it('renders children', () => {
    render(<PageTransition><div>Content</div></PageTransition>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('applies animation classes', () => {
    const { container } = render(<PageTransition><span>Test</span></PageTransition>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('animate-in')
    expect(wrapper.className).toContain('fade-in')
  })

  it('merges custom className', () => {
    const { container } = render(<PageTransition className="extra-class"><span>Test</span></PageTransition>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('extra-class')
  })
})
