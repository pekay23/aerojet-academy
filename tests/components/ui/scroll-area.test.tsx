import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

vi.mock('@radix-ui/react-scroll-area', () => ({
  Root: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  Viewport: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Scrollbar: ({ children, className, orientation, ...props }: any) => (
    <div className={className} data-orientation={orientation} {...props}>{children}</div>
  ),
  ScrollAreaThumb: ({ className }: any) => <div className={className} />,
  Corner: () => null,
}))

describe('ScrollArea', () => {
  it('renders without crashing', () => {
    render(<ScrollArea>Scrollable content</ScrollArea>)
    expect(screen.getByText('Scrollable content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<ScrollArea className="custom-scroll">Content</ScrollArea>)
    expect(document.querySelector('.custom-scroll')).toBeTruthy()
  })

  it('renders scrollbar', () => {
    render(<ScrollBar />)
    expect(document.querySelector('[data-orientation="vertical"]')).toBeTruthy()
  })
})
