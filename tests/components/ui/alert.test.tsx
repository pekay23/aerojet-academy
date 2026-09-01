import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

describe('Alert', () => {
  it('renders without crashing', () => {
    render(<Alert>Alert content</Alert>)
    expect(screen.getByText('Alert content')).toBeInTheDocument()
  })

  it('applies default variant', () => {
    render(<Alert>Default alert</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('applies destructive variant', () => {
    render(<Alert variant="destructive">Error alert</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert.getAttribute('data-variant')).toBe('destructive')
  })

  it('renders title', () => {
    render(<AlertTitle>Warning</AlertTitle>)
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<AlertDescription>Description text</AlertDescription>)
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Alert className="custom-alert">Content</Alert>)
    expect(screen.getByRole('alert').className).toContain('custom-alert')
  })
})
