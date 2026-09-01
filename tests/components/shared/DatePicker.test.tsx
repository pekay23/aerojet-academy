import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DatePicker } from '@/components/shared/DatePicker'

vi.mock('date-fns', () => ({
  format: (date: Date, fmt: string) => {
    if (fmt === 'PPP') return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    if (fmt === 'yyyy-MM-dd') return date.toISOString().split('T')[0]
    return date.toString()
  },
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, className }: any) => (
    <button className={className} data-variant={variant}>{children}</button>
  ),
}))

describe('DatePicker', () => {
  it('renders button with placeholder', () => {
    render(<DatePicker onSelect={vi.fn()} />)
    expect(screen.getByText('Pick a date')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(<DatePicker onSelect={vi.fn()} placeholder="Select date" />)
    expect(screen.getByText('Select date')).toBeInTheDocument()
  })

  it('displays selected date', () => {
    const date = new Date(2024, 0, 15)
    render(<DatePicker date={date} onSelect={vi.fn()} />)
    expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument()
  })

  it('renders date input', () => {
    const { container } = render(<DatePicker onSelect={vi.fn()} />)
    const input = container.querySelector('input[type="date"]')
    expect(input).toBeInTheDocument()
  })

  it('calls onSelect when date changes', () => {
    const onSelect = vi.fn()
    const { container } = render(<DatePicker onSelect={onSelect} />)
    const input = container.querySelector('input[type="date"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2024-03-15' } })
    expect(onSelect).toHaveBeenCalled()
  })
})
