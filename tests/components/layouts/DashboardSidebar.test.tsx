import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardSidebar from '@/components/layouts/DashboardSidebar'
import type React from 'react'

type MockImageProps = React.ComponentProps<'img'>
type MockLinkProps = React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
}>
type MockMotionProps<T extends HTMLElement> = React.PropsWithChildren<React.HTMLAttributes<T>>
type MockChildrenProps = React.PropsWithChildren

vi.mock('next/navigation', () => ({
  usePathname: () => '/staff/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: MockImageProps) => {
    const MockImage = 'img'
    return <MockImage src={props.src} alt={props.alt} width={props.width} height={props.height} />
  },
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: MockLinkProps) => <a href={href} {...props}>{children}</a>,
}))

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockMotionProps<HTMLDivElement>) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: MockMotionProps<HTMLElement>) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: MockChildrenProps) => <>{children}</>,
}))

vi.mock('@/components/shared/Logo', () => ({
  __esModule: true,
  default: (_props: Record<string, unknown>) => <div data-testid="logo">Logo</div>,
}))

vi.mock('@/components/shared/theme-provider', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: MockChildrenProps) => <>{children}</>,
  TooltipContent: ({ children }: MockChildrenProps) => <div>{children}</div>,
  TooltipTrigger: ({ children }: MockChildrenProps) => <div>{children}</div>,
}))

describe('DashboardSidebar', () => {
  const mockLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: undefined },
    { label: 'Settings', href: '/settings', icon: undefined },
  ]

  it('renders without crashing', () => {
    render(<DashboardSidebar links={mockLinks} portalLabel="Staff Portal" />)
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
  })

  it('renders all nav links', () => {
    render(<DashboardSidebar links={mockLinks} portalLabel="Staff Portal" />)
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders portal label', () => {
    render(<DashboardSidebar links={mockLinks} portalLabel="Staff Portal" />)
    expect(screen.getByText('Staff Portal')).toBeInTheDocument()
  })

  it('renders user name when provided', () => {
    render(<DashboardSidebar links={mockLinks} portalLabel="Staff Portal" userName="John Doe" />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders with header items', () => {
    const linksWithHeader = [
      { type: 'header' as const, label: 'Administration' },
      { label: 'Users', href: '/users', icon: undefined },
    ]
    render(<DashboardSidebar links={linksWithHeader} portalLabel="Staff Portal" />)
    expect(screen.getByText('Administration')).toBeInTheDocument()
  })
})
