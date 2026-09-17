import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WithdrawButton } from '@/components/exam-only/WithdrawButton'

describe('WithdrawButton', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    vi.resetAllMocks()
    global.fetch = originalFetch
  })

  it('renders Leave Pool button initially', () => {
    render(<WithdrawButton poolId="p1" poolName="Pool A" amountReserved={100} />)
    expect(screen.getByText('Leave Pool')).toBeInTheDocument()
  })

  it('shows confirm dialog on click', async () => {
    render(<WithdrawButton poolId="p1" poolName="Pool A" amountReserved={100} />)
    fireEvent.click(screen.getByText('Leave Pool'))
    expect(screen.getByText(/Withdraw from/)).toBeInTheDocument()
    expect(screen.getByText('Pool A')).toBeInTheDocument()
    expect(screen.getByText(/€100 will be released back to your wallet/)).toBeInTheDocument()
  })

  it('shows Cancel button in confirm dialog', async () => {
    render(<WithdrawButton poolId="p1" poolName="Pool A" amountReserved={100} />)
    fireEvent.click(screen.getByText('Leave Pool'))
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('cancels confirm dialog', async () => {
    render(<WithdrawButton poolId="p1" poolName="Pool A" amountReserved={100} />)
    fireEvent.click(screen.getByText('Leave Pool'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText(/Withdraw from/)).not.toBeInTheDocument()
  })

  it('calls onSuccess on successful withdraw', async () => {
    const onSuccess = vi.fn()
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as any)
    )

    render(<WithdrawButton poolId="p1" poolName="Pool A" amountReserved={100} onSuccess={onSuccess} />)
    fireEvent.click(screen.getByText('Leave Pool'))
    fireEvent.click(screen.getByText('Confirm Withdraw'))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('does not show release message when amount is zero', async () => {
    render(<WithdrawButton poolId="p1" poolName="Pool A" amountReserved={0} />)
    fireEvent.click(screen.getByText('Leave Pool'))
    expect(screen.queryByText(/will be released/)).not.toBeInTheDocument()
  })
})
