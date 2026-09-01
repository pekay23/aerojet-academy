import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'

vi.mock('cmdk', () => ({
  Command: Object.assign(
    ({ children, ...props }: any) => <div {...props}>{children}</div>,
    {
      Input: (props: any) => <input {...props} />,
      List: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      Empty: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      Group: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      Item: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      Separator: () => null,
      Shortcut: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    }
  ),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
}))

describe('Command', () => {
  it('renders without crashing', () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem>Action 1</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    )
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    render(
      <Command>
        <CommandList>
          <CommandEmpty>No results found</CommandEmpty>
        </CommandList>
      </Command>
    )
    expect(screen.getByText('No results found')).toBeInTheDocument()
  })
})
