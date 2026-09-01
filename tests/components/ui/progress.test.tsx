import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from '@/components/ui/progress'

describe('Progress', () => {
  it('renders without crashing', () => {
    render(<Progress value={50} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('displays value', () => {
    render(<Progress value={75} />)
    const indicator = screen.getByRole('progressbar').firstChild as HTMLElement
    expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' })
  })

  it('applies custom className', () => {
    render(<Progress value={50} className="custom-progress" />)
    expect(document.querySelector('.custom-progress')).toBeTruthy()
  })
})
