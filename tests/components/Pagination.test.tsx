import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '@/components/shared/Pagination'

describe('Pagination', () => {
  it('renders page info', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()
  })

  it('renders previous and next buttons', () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />)
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('calls onPageChange with previous page', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByText('Previous'))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('calls onPageChange with next page', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByText('Next'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('disables previous button on first page', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByText('Previous').closest('button')).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByText('Next').closest('button')).toBeDisabled()
  })

  it('returns null when totalPages is 1 or less', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })
})
