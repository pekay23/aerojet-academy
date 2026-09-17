import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchInput } from '@/components/shared/SearchInput'

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

describe('SearchInput', () => {
  it('renders without crashing', () => {
    render(<SearchInput onSearch={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('renders custom placeholder', () => {
    render(<SearchInput onSearch={vi.fn()} placeholder="Find courses..." />)
    expect(screen.getByPlaceholderText('Find courses...')).toBeInTheDocument()
  })

  it('calls onSearch on input change', async () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} />)
    const input = screen.getByPlaceholderText('Search...')
    fireEvent.change(input, { target: { value: 'test' } })
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test')
    })
  })

  it('renders clear button when value present', () => {
    render(<SearchInput onSearch={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search...')
    fireEvent.change(input, { target: { value: 'search term' } })
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
  })

  it('clears input when clear button clicked', () => {
    render(<SearchInput onSearch={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search...')
    fireEvent.change(input, { target: { value: 'search' } })
    fireEvent.click(screen.getByLabelText('Clear search'))
    expect(input).toHaveValue('')
  })
})
