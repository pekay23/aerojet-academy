import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UnsavedChangesDialog } from '@/components/shared/UnsavedChangesDialog'

describe('UnsavedChangesDialog', () => {
  it('renders title and description', () => {
    render(<UnsavedChangesDialog open={true} onProceed={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
    expect(screen.getByText(/if you leave now/i)).toBeInTheDocument()
  })

  it('renders Keep Editing and Discard & Switch buttons', () => {
    render(<UnsavedChangesDialog open={true} onProceed={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Keep Editing')).toBeInTheDocument()
    expect(screen.getByText('Discard & Switch')).toBeInTheDocument()
  })

  it('calls onCancel when keep editing button is clicked', () => {
    const onCancel = vi.fn()
    render(<UnsavedChangesDialog open={true} onProceed={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Keep Editing'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('calls onProceed when discard button is clicked', () => {
    const onProceed = vi.fn()
    render(<UnsavedChangesDialog open={true} onProceed={onProceed} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByText('Discard & Switch'))
    expect(onProceed).toHaveBeenCalled()
  })
})
