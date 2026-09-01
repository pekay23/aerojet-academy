import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ThemeToggle from '@/components/shared/ThemeToggle'

describe('ThemeToggle', () => {
  it('renders toggle button', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('renders Light Mode label when theme is light', () => {
    render(<ThemeToggle />)
    expect(screen.getByText('Light Mode')).toBeInTheDocument()
  })

  it('renders collapsed label', () => {
    render(<ThemeToggle isCollapsed />)
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Light Mode')
  })
})
