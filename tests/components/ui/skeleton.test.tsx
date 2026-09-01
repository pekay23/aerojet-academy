import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'

describe('Skeleton', () => {
  it('renders without crashing', () => {
    render(<Skeleton />)
    expect(document.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('applies custom className', () => {
    render(<Skeleton className="h-4 w-20" />)
    const el = document.querySelector('.animate-pulse') as HTMLElement
    expect(el.className).toContain('h-4')
    expect(el.className).toContain('w-20')
  })

  it('renders children', () => {
    render(<Skeleton><span>Loading</span></Skeleton>)
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})
