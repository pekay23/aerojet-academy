import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormField } from '@/components/forms/FormField'

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, className }: any) => <label className={className}>{children}</label>,
}))

describe('FormField', () => {
  it('renders label', () => {
    render(<FormField label="Email"><input /></FormField>)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(<FormField label="Email"><input data-testid="email-input" /></FormField>)
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
  })

  it('renders required indicator', () => {
    render(<FormField label="Email" required={true}><input /></FormField>)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(<FormField label="Email" error="Required field"><input /></FormField>)
    expect(screen.getByText('Required field')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<FormField label="Email" description="Enter your email"><input /></FormField>)
    expect(screen.getByText('Enter your email')).toBeInTheDocument()
  })

  it('applies error class to label when error present', () => {
    render(<FormField label="Email" error="Error"><input /></FormField>)
    const label = screen.getByText('Email')
    expect(label.className).toContain('text-destructive')
  })

  it('applies custom className', () => {
    const { container } = render(<FormField label="Email" className="custom-field"><input /></FormField>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('custom-field')
  })
})
