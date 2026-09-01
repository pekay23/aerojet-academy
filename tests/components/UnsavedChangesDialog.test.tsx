import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UnsavedChangesDialog } from '@/components/shared/UnsavedChangesDialog'

describe('UnsavedChangesDialog', () => {
  it('renders title and description', () => {
    render(
      <UnsavedChangesDialog open={true} onProceed={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
    expect(screen.getByText(/unsaved changes on this tab/i)).toBeInTheDocument()
  })

  it('renders Stay & Keep Editing and Discard Changes buttons', () => {
    render(
      <UnsavedChangesDialog open={true} onProceed={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByText('Stay & Keep Editing')).toBeInTheDocument()
    expect(screen.getByText('Discard Changes')).toBeInTheDocument()
  })

  it('calls onCancel when stay button is clicked', () => {
    const onCancel = vi.fn()
    render(
      <UnsavedChangesDialog open={true} onProceed={vi.fn()} onCancel={onCancel} />
    )
    fireEvent.click(screen.getByText('Stay & Keep Editing'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('calls onProceed when discard button is clicked', () => {
    const onProceed = vi.fn()
    render(
      <UnsavedChangesDialog open={true} onProceed={onProceed} onCancel={vi.fn()} />
    )
    fireEvent.click(screen.getByText('Discard Changes'))
    expect(onProceed).toHaveBeenCalled()
  })
})
