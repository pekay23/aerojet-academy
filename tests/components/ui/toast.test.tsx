import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Toast, ToastTitle, ToastDescription, ToastClose, ToastAction, ToastViewport } from '@/components/ui/toast'

vi.mock('@radix-ui/react-toast', () => ({
  Provider: ({ children }: any) => <div>{children}</div>,
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Title: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Description: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Close: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Action: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Viewport: ({ ...props }: any) => <div {...props} />,
}))

describe('Toast', () => {
  it('renders without crashing', () => {
    render(<Toast>Toast message</Toast>)
    expect(screen.getByText('Toast message')).toBeInTheDocument()
  })

  it('renders title', () => {
    render(<ToastTitle>Success</ToastTitle>)
    expect(screen.getByText('Success')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<ToastDescription>Operation completed</ToastDescription>)
    expect(screen.getByText('Operation completed')).toBeInTheDocument()
  })

  it('renders action button', () => {
    render(<ToastAction>Undo</ToastAction>)
    expect(screen.getByText('Undo')).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(<ToastClose />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('applies destructive variant', () => {
    render(<Toast variant="destructive">Error</Toast>)
    expect(screen.getByText('Error').className).toContain('destructive')
  })
})
