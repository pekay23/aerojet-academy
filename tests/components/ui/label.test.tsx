import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'

vi.mock('@radix-ui/react-label', () => ({
  Root: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

describe('Label', () => {
  it('renders without crashing', () => {
    render(<Label>Email</Label>)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Label className="custom-label">Name</Label>)
    expect(screen.getByText('Name').className).toContain('custom-label')
  })

  it('applies base classes', () => {
    render(<Label>Test</Label>)
    expect(screen.getByText('Test').className).toContain('font-medium')
  })
})
