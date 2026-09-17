import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CourseCategoryFilter } from '@/components/CourseCategoryFilter'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}))

describe('CourseCategoryFilter', () => {
  const mockCategories = [
    { id: '1', name: 'Engineering' },
    { id: '2', name: 'Aviation' },
  ]

  it('renders without crashing', () => {
    render(<CourseCategoryFilter categories={mockCategories} />)
    expect(screen.getAllByText('All Categories').length).toBeGreaterThan(0)
  })

  it('renders category options', () => {
    render(<CourseCategoryFilter categories={mockCategories} />)
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Aviation')).toBeInTheDocument()
  })

  it('renders with current category', () => {
    render(<CourseCategoryFilter categories={mockCategories} currentCategory="Engineering" />)
    expect(screen.getByText('Engineering')).toBeInTheDocument()
  })
})
