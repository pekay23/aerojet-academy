import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthThemeProvider } from '@/components/shared/AuthThemeProvider'

vi.mock('@/components/shared/theme-provider', () => ({
  ThemeProvider: ({ children }: any) => <div data-testid="theme-provider">{children}</div>,
}))

describe('AuthThemeProvider', () => {
  it('renders children', () => {
    render(<AuthThemeProvider><div>Content</div></AuthThemeProvider>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('wraps with ThemeProvider', () => {
    render(<AuthThemeProvider><span>Test</span></AuthThemeProvider>)
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
  })
})
