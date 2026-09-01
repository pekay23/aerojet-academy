import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WalletConfirmModal } from '@/components/shared/WalletConfirmModal'

describe('WalletConfirmModal', () => {
  it('renders children trigger', () => {
    render(
      <WalletConfirmModal amount={100} onConfirm={vi.fn()}>
        <button>Pay Now</button>
      </WalletConfirmModal>
    )
    expect(screen.getByText('Pay Now')).toBeInTheDocument()
  })

  it('renders title and description', () => {
    render(
      <WalletConfirmModal amount={50} onConfirm={vi.fn()} title="Confirm" description="Proceed?">
        <button>Open</button>
      </WalletConfirmModal>
    )
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Proceed?')).toBeInTheDocument()
  })

  it('renders formatted amount', () => {
    render(
      <WalletConfirmModal amount={99.99} onConfirm={vi.fn()}>
        <button>Open</button>
      </WalletConfirmModal>
    )
    expect(screen.getByText('EUR 99.99')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn()
    render(
      <WalletConfirmModal amount={100} onConfirm={onConfirm}>
        <button>Open</button>
      </WalletConfirmModal>
    )
    fireEvent.click(screen.getByRole('button', { name: /confirm payment/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('renders destructive variant', () => {
    render(
      <WalletConfirmModal amount={100} onConfirm={vi.fn()} isDestructive>
        <button>Open</button>
      </WalletConfirmModal>
    )
    expect(screen.getByRole('button', { name: 'Confirm Payment' })).toBeInTheDocument()
  })
})
