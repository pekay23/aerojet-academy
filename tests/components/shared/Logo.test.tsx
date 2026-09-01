import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Logo from '@/components/shared/Logo'

vi.mock('next/image', () => ({
  default: (props: any) => {
    const { src, alt, width, height, priority, className } = props
    return <img src={src} alt={alt} width={width} height={height} className={className} data-priority={priority ? '' : undefined} />
  },
}))

describe('Logo', () => {
  it('renders with default props', () => {
    render(<Logo />)
    const img = screen.getByAltText('Aerojet Academy')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toContain('AATA_logo_hor_onWhite')
  })

  it('renders dark tone variant', () => {
    render(<Logo tone="onDark" />)
    const img = screen.getByAltText('Aerojet Academy')
    expect(img.getAttribute('src')).toContain('ATA_logo_hor_onDark')
  })

  it('applies custom className', () => {
    render(<Logo className="h-16" />)
    const img = screen.getByAltText('Aerojet Academy')
    expect(img.className).toContain('h-16')
  })

  it('renders with priority', () => {
    render(<Logo priority={true} />)
    const img = screen.getByAltText('Aerojet Academy')
    expect(img).toHaveAttribute('data-priority')
  })
})
