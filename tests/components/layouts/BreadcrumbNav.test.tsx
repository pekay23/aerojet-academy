import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/staff/dashboard',
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

describe('BreadcrumbNav', () => {
  it('renders without crashing', () => {
    render(<BreadcrumbNav />)
    expect(screen.getByText('Staff Dashboard')).toBeInTheDocument()
  })

  it('renders breadcrumb nav element', () => {
    render(<BreadcrumbNav />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
  })

  it('renders sub-segments', () => {
    render(<BreadcrumbNav />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<BreadcrumbNav className="custom-breadcrumb" />)
    const nav = container.firstChild as HTMLElement
    expect(nav.className).toContain('custom-breadcrumb')
  })
})
