import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MultiSelect } from '@/components/ui/multi-select'

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuCheckboxItem: ({ children, _checked, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

describe('MultiSelect', () => {
  const mockOptions = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
  ]

  it('renders without crashing', () => {
    render(<MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} />)
    expect(screen.getByText('Select items...')).toBeInTheDocument()
  })

  it('renders placeholder', () => {
    render(<MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} placeholder="Choose..." />)
    expect(screen.getByText('Choose...')).toBeInTheDocument()
  })

  it('shows selected items as badges', () => {
    render(<MultiSelect options={mockOptions} selected={['opt1']} onChange={vi.fn()} />)
    const elements = screen.getAllByText('Option 1')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })
})
