import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '@/components/shared/Modal'

describe('Modal', () => {
  it('renders title and children when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('renders close button', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('hides close button when showClose is false', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" showClose={false}>
        <p>Content</p>
      </Modal>
    )
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('renders with different sizes', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test" size="lg">
        <p>Content</p>
      </Modal>
    )
    const dialog = container.querySelector('[class*="max-w-lg"]')
    expect(dialog).toBeTruthy()
  })
})
