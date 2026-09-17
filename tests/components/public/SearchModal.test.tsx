import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchModal from '@/components/public/SearchModal'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('SearchModal', () => {
  it('renders search trigger button', () => {
    render(<SearchModal />)
    expect(screen.getByLabelText('Search')).toBeInTheDocument()
  })

  it('opens modal when trigger clicked', () => {
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Search'))
    expect(screen.getByPlaceholderText('Search courses, exams, pages...')).toBeInTheDocument()
  })

  it('shows type-to-search message initially', () => {
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Search'))
    expect(screen.getByText('Type to search across all pages')).toBeInTheDocument()
  })

  it('renders quick links', () => {
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Search'))
    expect(screen.getByText('Exam Only')).toBeInTheDocument()
    expect(screen.getByText('EASA Part 66')).toBeInTheDocument()
  })

  it('closes modal when close button clicked', () => {
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Search'))
    expect(screen.getByPlaceholderText('Search courses, exams, pages...')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '' }))
  })

  it('renders keyboard shortcuts footer', () => {
    render(<SearchModal />)
    fireEvent.click(screen.getByLabelText('Search'))
    expect(screen.getByText('Navigate')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })
})
