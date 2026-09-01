import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileUpload } from '@/components/shared/FileUpload'

vi.mock('@/components/ui/button', () => ({
  Button: ({ children }: any) => <button>{children}</button>,
}))

describe('FileUpload', () => {
  it('renders upload label', () => {
    render(<FileUpload onFileSelect={vi.fn()} />)
    expect(screen.getByText('Upload file')).toBeInTheDocument()
  })

  it('renders custom label', () => {
    render(<FileUpload onFileSelect={vi.fn()} label="Upload PDF" />)
    expect(screen.getByText('Upload PDF')).toBeInTheDocument()
  })

  it('displays max size info', () => {
    render(<FileUpload onFileSelect={vi.fn()} maxSize={10} />)
    expect(screen.getByText('Max 10MB')).toBeInTheDocument()
  })

  it('shows file name after selection', () => {
    const onFileSelect = vi.fn()
    const { container } = render(<FileUpload onFileSelect={onFileSelect} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    Object.defineProperty(input, 'files', { value: [file] })
    fireEvent.change(input)
    expect(screen.getByText('test.pdf')).toBeInTheDocument()
  })

  it('shows error for oversized file', () => {
    const { container } = render(<FileUpload onFileSelect={vi.fn()} maxSize={1} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(input, 'files', { value: [bigFile] })
    fireEvent.change(input)
    expect(screen.getByText('File must be less than 1MB')).toBeInTheDocument()
  })

  it('renders remove button after file selected', () => {
    const { container } = render(<FileUpload onFileSelect={vi.fn()} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    Object.defineProperty(input, 'files', { value: [file] })
    fireEvent.change(input)
    expect(screen.getByLabelText('Remove file')).toBeInTheDocument()
  })
})
