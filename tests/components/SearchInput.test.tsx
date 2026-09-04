import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchInput from '@/components/SearchInput'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: any) => {
    const debounced = (value: string) => fn(value)
    debounced.cancel = vi.fn()
    return debounced
  },
}))

describe('SearchInput', () => {
  it('renders without crashing', () => {
    render(<SearchInput placeholder="Search students..." />)
    expect(screen.getByPlaceholderText('Search students...')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<SearchInput placeholder="Search..." />)
    expect(screen.getByLabelText('Search...')).toBeInTheDocument()
  })

  it('renders search icon', () => {
    const { container } = render(<SearchInput placeholder="Search..." />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('accepts custom id', () => {
    render(<SearchInput placeholder="Search..." id="custom-search" />)
    expect(screen.getByPlaceholderText('Search...')).toHaveAttribute('id', 'custom-search')
  })
})
