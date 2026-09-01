import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CurrencyToggle from '@/components/CurrencyToggle'

describe('CurrencyToggle', () => {
  it('renders without crashing', async () => {
    render(<CurrencyToggle amount={100} />)
    await waitFor(() => {
      expect(screen.getByText('EUR')).toBeInTheDocument()
    })
  })

  it('displays amount', async () => {
    render(<CurrencyToggle amount={150.50} />)
    await waitFor(() => {
      expect(screen.getByText(/150/)).toBeInTheDocument()
    })
  })

  it('cycles currency on click', async () => {
    render(<CurrencyToggle amount={100} />)
    await waitFor(() => {
      expect(screen.getByText('EUR')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('EUR').closest('button')!)
    expect(screen.getByText('GHS')).toBeInTheDocument()
  })

  it('hides symbol when showSymbol is false', async () => {
    render(<CurrencyToggle amount={100} showSymbol={false} />)
    await waitFor(() => {
      expect(screen.queryByText('€')).not.toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    const { container } = render(<CurrencyToggle amount={100} className="custom-toggle" />)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('custom-toggle')
  })
})
