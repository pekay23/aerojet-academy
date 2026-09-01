import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PortalHeader from '@/components/layouts/PortalHeader'

describe('PortalHeader', () => {
  it('renders children', () => {
    render(<PortalHeader><h1>Dashboard</h1></PortalHeader>)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders actions', () => {
    render(<PortalHeader actions={<button>Action</button>}><h1>Title</h1></PortalHeader>)
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<PortalHeader className="custom-header"><span>Test</span></PortalHeader>)
    const header = container.firstChild as HTMLElement
    expect(header.className).toContain('custom-header')
  })

  it('renders without actions', () => {
    render(<PortalHeader><span>Content</span></PortalHeader>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
