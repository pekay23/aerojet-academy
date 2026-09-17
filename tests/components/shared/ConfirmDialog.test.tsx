import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  AlertDialogAction: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>{children}</button>
  ),
  AlertDialogCancel: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
}))

describe('ConfirmDialog', () => {
  it('renders title and description when open', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Delete Item"
        description="Are you sure?"
        onConfirm={vi.fn()}
      />
    )
    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={vi.fn()}
        title="Delete Item"
        description="Are you sure?"
        onConfirm={vi.fn()}
      />
    )
    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Delete"
        description="Sure?"
        onConfirm={onConfirm}
      />
    )
    fireEvent.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Delete"
        description="Sure?"
        onConfirm={vi.fn()}
        loading={true}
      />
    )
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('renders destructive variant', () => {
    const { container } = render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Delete"
        description="Sure?"
        onConfirm={vi.fn()}
        variant="destructive"
      />
    )
    const btn = container.querySelector('.bg-destructive')
    expect(btn).toBeInTheDocument()
  })
})
