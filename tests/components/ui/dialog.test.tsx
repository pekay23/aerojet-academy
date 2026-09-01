import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Close: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Portal: ({ children }: any) => <div>{children}</div>,
  Overlay: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Title: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  Description: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}))

describe('Dialog', () => {
  it('renders without crashing', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('renders content elements', () => {
    render(
      <Dialog>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <DialogFooter>Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})
