import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders title and description when open', () => {
    render(
      <ConfirmDialog open={true} onOpenChange={vi.fn()} title="Delete?" description="Are you sure?" onConfirm={vi.fn()} />
    )
    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('renders confirm and cancel buttons', () => {
    render(
      <ConfirmDialog open={true} onOpenChange={vi.fn()} title="Confirm" description="Proceed?" onConfirm={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})
