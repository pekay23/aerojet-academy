import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProtectedImage } from '@/components/ProtectedImage'

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { alt, src, width, height, className } = props
    return <img src={src} alt={alt} width={width} height={height} className={className} />
  },
}))

describe('ProtectedImage', () => {
  it('renders image', () => {
    render(<ProtectedImage src="/test.jpg" alt="Test" width={100} height={100} />)
    expect(screen.getByAltText('Test')).toBeInTheDocument()
  })

  it('renders overlay by default', () => {
    const { container } = render(<ProtectedImage src="/test.jpg" alt="Test" width={100} height={100} />)
    const overlay = container.querySelector('[aria-hidden="true"]')
    expect(overlay).toBeInTheDocument()
  })

  it('hides overlay when overlay is false', () => {
    const { container } = render(<ProtectedImage src="/test.jpg" alt="Test" width={100} height={100} overlay={false} />)
    const overlay = container.querySelector('[aria-hidden="true"]')
    expect(overlay).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<ProtectedImage src="/test.jpg" alt="Test" width={100} height={100} className="custom-img" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('custom-img')
  })
})
