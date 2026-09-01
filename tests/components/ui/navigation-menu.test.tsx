import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from '@/components/ui/navigation-menu'

vi.mock('@radix-ui/react-navigation-menu', () => ({
  Root: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
  List: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
  Item: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  Viewport: () => null,
  Indicator: () => null,
}))

describe('NavigationMenu', () => {
  it('renders without crashing', () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item</NavigationMenuTrigger>
            <NavigationMenuContent>Content</NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(screen.getByText('Item')).toBeInTheDocument()
  })
})
