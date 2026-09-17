import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

vi.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Portal: ({ children }: any) => <div>{children}</div>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Item: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Label: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Separator: ({ ...props }: any) => <hr {...props} />,
  Group: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Sub: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SubTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SubContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CheckboxItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  RadioItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  RadioGroup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  ItemIndicator: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

describe('DropdownMenu', () => {
  it('renders without crashing', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByText('Open Menu')).toBeInTheDocument()
  })

  it('renders menu items', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Cancel</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })
})
