import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MotionTabs from '@/components/ui/MotionTabs'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('MotionTabs', () => {
  const mockTabs = [
    { key: 'tab1', label: 'Tab 1' },
    { key: 'tab2', label: 'Tab 2' },
  ]

  it('renders without crashing', () => {
    render(<MotionTabs tabs={mockTabs} activeTab="tab1" onChange={vi.fn()} />)
    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
  })

  it('renders tablist role', () => {
    render(<MotionTabs tabs={mockTabs} activeTab="tab1" onChange={vi.fn()} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('calls onChange when tab clicked', () => {
    const onChange = vi.fn()
    render(<MotionTabs tabs={mockTabs} activeTab="tab1" onChange={onChange} />)
    fireEvent.click(screen.getByText('Tab 2'))
    expect(onChange).toHaveBeenCalledWith('tab2')
  })

  it('sets aria-selected on active tab', () => {
    render(<MotionTabs tabs={mockTabs} activeTab="tab1" onChange={vi.fn()} />)
    const activeTab = screen.getByRole('tab', { selected: true })
    expect(activeTab).toBeInTheDocument()
  })

  it('renders with aria-label', () => {
    render(<MotionTabs tabs={mockTabs} activeTab="tab1" onChange={vi.fn()} ariaLabel="Content tabs" />)
    expect(screen.getByLabelText('Content tabs')).toBeInTheDocument()
  })
})
