import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MobileNav from '@/components/layouts/MobileNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

describe('MobileNav', () => {
  it('renders without crashing', () => {
    render(<MobileNav />)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders all nav links', () => {
    render(<MobileNav />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Admissions')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
  })

  it('renders nav element', () => {
    const { container } = render(<MobileNav />)
    expect(container.querySelector('nav')).toBeInTheDocument()
  })
})
