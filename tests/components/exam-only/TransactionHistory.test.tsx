import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TransactionHistory } from '@/components/exam-only/TransactionHistory'

describe('TransactionHistory', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    vi.resetAllMocks()
    global.fetch = originalFetch
  })

  it('shows loading state initially', () => {
    global.fetch = vi.fn(() => new Promise<Response>(() => {}))
    render(<TransactionHistory />)
    expect(screen.getByText('Loading transactions...')).toBeInTheDocument()
  })

  it('shows empty state when no transactions', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ transactions: [] }),
      } as any)
    )

    render(<TransactionHistory />)

    await waitFor(() => {
      expect(screen.getByText('No transactions yet. Top up your wallet to get started.')).toBeInTheDocument()
    })
  })

  it('renders transaction list', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            transactions: [
              {
                id: '1',
                type: 'TOP_UP',
                amount: 100,
                description: 'Wallet top-up',
                createdAt: '2025-01-15T10:00:00Z',
                balanceAfter: 100,
              },
              {
                id: '2',
                type: 'PAYMENT',
                amount: 50,
                description: 'Exam payment',
                createdAt: '2025-01-16T10:00:00Z',
                balanceAfter: 50,
              },
            ],
          }),
      } as any)
    )

    render(<TransactionHistory />)

    await waitFor(() => {
      expect(screen.getByText('Wallet top-up')).toBeInTheDocument()
    })
    expect(screen.getByText('Exam payment')).toBeInTheDocument()
  })

})
