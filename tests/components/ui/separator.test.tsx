import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Separator } from '@/components/ui/separator'

vi.mock('@radix-ui/react-separator', () => ({
  Root: ({ className, orientation, decorative, ...props }: any) => (
    <div className={className} data-orientation={orientation} {...props} />
  ),
}))

describe('Separator', () => {
  it('renders without crashing', () => {
    render(<Separator />)
    const sep = document.querySelector('[data-orientation]')
    expect(sep).toBeTruthy()
  })

  it('renders horizontal by default', () => {
    const { container } = render(<Separator />)
    const sep = container.firstChild as HTMLElement
    expect(sep.getAttribute('data-orientation')).toBe('horizontal')
  })

  it('renders vertical', () => {
    const { container } = render(<Separator orientation="vertical" />)
    const sep = container.firstChild as HTMLElement
    expect(sep.getAttribute('data-orientation')).toBe('vertical')
  })

  it('applies custom className', () => {
    render(<Separator className="custom-sep" />)
    expect(document.querySelector('.custom-sep')).toBeTruthy()
  })
})
