import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicNav from '@/components/layouts/PublicNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('@/components/shared/Logo', () => ({
  __esModule: true,
  default: (_props: any) => <div data-testid="logo">Logo</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/navigation-menu', () => ({
  NavigationMenu: ({ children }: any) => <div>{children}</div>,
  NavigationMenuContent: ({ children }: any) => <div>{children}</div>,
  NavigationMenuItem: ({ children }: any) => <div>{children}</div>,
  NavigationMenuList: ({ children }: any) => <div>{children}</div>,
  NavigationMenuTrigger: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: any) => <div>{children}</div>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AccordionTrigger: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/public/SearchModal', () => ({
  __esModule: true,
  default: () => <div data-testid="search-modal" />,
}))

describe('PublicNav', () => {
  it('renders without crashing', () => {
    render(<PublicNav />)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders nav links', () => {
    render(<PublicNav />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Admissions')).toBeInTheDocument()
    expect(screen.getByText('Newsroom')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('renders login and register links', () => {
    render(<PublicNav />)
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
  })
})
