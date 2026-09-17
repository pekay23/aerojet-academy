import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TablePagination from '@/components/shared/TablePagination'

describe('TablePagination', () => {
  const defaultProps = {
    page: 1,
    perPage: 10,
    total: 50,
    onPageChange: vi.fn(),
    onPerPageChange: vi.fn(),
  }

  it('renders page info', () => {
    render(<TablePagination {...defaultProps} />)
    expect(screen.getByText('1–10 of 50')).toBeInTheDocument()
  })

  it('renders page indicator', () => {
    render(<TablePagination {...defaultProps} />)
    expect(screen.getByText('1 / 5')).toBeInTheDocument()
  })

  it('disables previous button on first page', () => {
    render(<TablePagination {...defaultProps} />)
    const prevBtn = screen.getByLabelText('Previous page')
    expect(prevBtn).toBeDisabled()
  })

  it('calls onPageChange on next button click', () => {
    const onPageChange = vi.fn()
    render(<TablePagination {...defaultProps} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('shows "No results" when total is 0', () => {
    render(<TablePagination {...defaultProps} total={0} />)
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('renders per-page selector', () => {
    render(<TablePagination {...defaultProps} />)
    expect(screen.getByLabelText('Rows per page')).toBeInTheDocument()
  })

  it('calls onPerPageChange when per-page changes', () => {
    const onPerPageChange = vi.fn()
    render(<TablePagination {...defaultProps} onPerPageChange={onPerPageChange} />)
    const select = screen.getByLabelText('Rows per page') as HTMLSelectElement
    fireEvent.change(select, { target: { value: '25' } })
    expect(onPerPageChange).toHaveBeenCalledWith(25)
  })
})
