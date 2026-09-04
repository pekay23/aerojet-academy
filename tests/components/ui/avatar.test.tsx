import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

vi.mock('@radix-ui/react-avatar', () => ({
  Root: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  // eslint-disable-next-line jsx-a11y/alt-text
  Image: ({ className, ...props }: any) => <img className={className} {...props} />,
  Fallback: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
}))

describe('Avatar', () => {
  it('renders without crashing', () => {
    render(<Avatar />)
    expect(document.querySelector('.rounded-full')).toBeTruthy()
  })

  it('renders image', () => {
    render(<AvatarImage src="/avatar.jpg" alt="User" />)
    expect(screen.getByAltText('User')).toBeInTheDocument()
  })

  it('renders fallback', () => {
    render(<AvatarFallback>JD</AvatarFallback>)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Avatar className="custom-avatar" />)
    expect(document.querySelector('.custom-avatar')).toBeTruthy()
  })
})
