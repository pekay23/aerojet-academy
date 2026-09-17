import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TMinusTooltip from '@/components/shared/TMinusTooltip'

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}))

describe('TMinusTooltip', () => {
  it('renders T- prefix with days', () => {
    render(<TMinusTooltip days={30} />)
    expect(screen.getByText('T-30')).toBeInTheDocument()
  })

  it('renders custom text', () => {
    render(<TMinusTooltip days={7} text="Starts in 7 days" />)
    expect(screen.getByText('Starts in 7 days')).toBeInTheDocument()
  })

  it('renders info icon', () => {
    const { container } = render(<TMinusTooltip days={14} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
