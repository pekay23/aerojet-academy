import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserAvatar } from '@/components/shared/UserAvatar'

describe('UserAvatar', () => {
  it('renders initials from first and last name', () => {
    render(<UserAvatar firstName="John" lastName="Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders question mark when no name provided', () => {
    render(<UserAvatar />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders uppercase initials for lowercase names', () => {
    render(<UserAvatar firstName="john" lastName="doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('applies correct size class', () => {
    const { container } = render(<UserAvatar firstName="John" lastName="Doe" size="lg" />)
    const avatar = container.firstChild as HTMLElement
    expect(avatar.className).toContain('h-14')
    expect(avatar.className).toContain('w-14')
  })

  it('applies default size when not specified', () => {
    const { container } = render(<UserAvatar firstName="John" lastName="Doe" />)
    const avatar = container.firstChild as HTMLElement
    expect(avatar.className).toContain('h-10')
    expect(avatar.className).toContain('w-10')
  })

  it('merges custom className', () => {
    const { container } = render(<UserAvatar firstName="John" lastName="Doe" className="border-2" />)
    const avatar = container.firstChild as HTMLElement
    expect(avatar.className).toContain('border-2')
    expect(avatar.className).toContain('h-10')
  })
})
