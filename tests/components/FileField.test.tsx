import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileField, { FileFieldProps } from '@/components/shared/FileField'

describe('FileField', () => {
  const defaultProps: FileFieldProps = {
    route: 'paymentProof',
    value: null,
    onChange: vi.fn(),
  }

  it('renders label', () => {
    render(<FileField {...defaultProps} label="Payment proof" />)
    expect(screen.getByText('Payment proof')).toBeInTheDocument()
  })

  it('renders upload button in empty state', () => {
    render(<FileField {...defaultProps} />)
    expect(screen.getByTestId('upload-thing-button')).toBeInTheDocument()
  })

  it('renders uploaded state when value is set', () => {
    render(<FileField {...defaultProps} value="https://example.com/file.pdf" />)
    expect(screen.getByText('Uploaded')).toBeInTheDocument()
    expect(screen.getByText('view')).toBeInTheDocument()
  })

  it('calls onChange with null when remove is clicked', () => {
    const onChange = vi.fn()
    render(<FileField {...defaultProps} value="https://example.com/file.pdf" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Remove file'))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('shows error message', () => {
    render(<FileField {...defaultProps} error="File too large" />)
    expect(screen.getByText('File too large')).toBeInTheDocument()
  })

  it('shows hint text', () => {
    render(<FileField {...defaultProps} hint="Max 5MB" />)
    expect(screen.getByText('Max 5MB')).toBeInTheDocument()
  })

  it('disables button when disabled is true', () => {
    render(<FileField {...defaultProps} disabled />)
    const wrapper = screen.getByTestId('upload-thing-button')
    expect(wrapper.querySelector('input[type="file"]')).toBeDisabled()
  })
})
