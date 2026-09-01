import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageLoading } from '@/components/shared/PageLoading'

vi.mock('@/components/shared/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: any) => <div data-testid="spinner" data-size={size} />,
}))

describe('PageLoading', () => {
  it('renders without crashing', () => {
    render(<PageLoading />)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('renders default message', () => {
    render(<PageLoading />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders custom message', () => {
    render(<PageLoading message="Fetching data..." />)
    expect(screen.getByText('Fetching data...')).toBeInTheDocument()
  })

  it('uses large spinner', () => {
    render(<PageLoading />)
    expect(screen.getByTestId('spinner').getAttribute('data-size')).toBe('lg')
  })
})
