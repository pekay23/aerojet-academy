import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

vi.mock('@radix-ui/react-select', () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Value: ({ children, placeholder, ...props }: any) => <span {...props}>{children || placeholder}</span>,
  Portal: ({ children }: any) => <div>{children}</div>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Viewport: ({ children }: any) => <div>{children}</div>,
  Item: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  ItemText: ({ children }: any) => <span>{children}</span>,
  ItemIndicator: ({ children }: any) => <span>{children}</span>,
  Label: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Separator: ({ ...props }: any) => <hr {...props} />,
  ScrollUpButton: () => null,
  ScrollDownButton: () => null,
  Icon: ({ children }: any) => <span>{children}</span>,
  Group: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

describe('Select', () => {
  it('renders without crashing', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText('Select an option')).toBeInTheDocument()
  })

  it('renders trigger', () => {
    render(
      <Select>
        <SelectTrigger>Click</SelectTrigger>
      </Select>
    )
    expect(screen.getByText('Click')).toBeInTheDocument()
  })

  it('renders items', () => {
    render(
      <Select>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText('Option A')).toBeInTheDocument()
    expect(screen.getByText('Option B')).toBeInTheDocument()
  })
})
